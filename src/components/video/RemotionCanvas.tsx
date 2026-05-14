'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';

// ─── Frame-accurate 30fps canvas preview with Barber Logic ────────────────────
// Implements: Hormozi captions, Reveal Flash, 1.2× keyword zoom, dead-air markers

const FPS = 30;
const spring: Transition = { type: 'spring', stiffness: 100, damping: 20 };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimelineWord {
  word: string;
  start: number; // seconds
  end: number;   // seconds
  isKeyword?: boolean;  // triggers 1.2× zoom
  isReveal?: boolean;   // triggers Reveal Flash
}

interface RemotionCanvasProps {
  words?: TimelineWord[];
  duration?: number;
  styleKey?: string;
  isRTL?: boolean;
  missionTitle?: string;
  highlightColor?: string;
  className?: string;
  // Barber Logic controls
  showRevealFlash?: boolean;
  transitionSpeed?: number; // seconds (from PRESET_SPEED)
}

// ─── Style presets ────────────────────────────────────────────────────────────

const STYLE_BG: Record<string, string> = {
  barber:  '#0a0a0a',
  gym:     '#080a08',
  hvac:    '#080a0d',
  minimal: '#050505',
  vibrant: '#0d080a',
};

const STYLE_ACCENT: Record<string, string> = {
  barber:  '#EA580C',
  gym:     '#EA580C',
  hvac:    '#FFFF00',
  minimal: '#ffffff',
  vibrant: '#EA580C',
};

// ─── Detect "reveal" words (first word after a gap, or sentence-start) ────────

function markRevealWords(words: TimelineWord[]): TimelineWord[] {
  return words.map((w, i) => {
    const isReveal = i === 0 || (i > 0 && (w.start - words[i - 1].end) > 0.35);
    // Mark keywords as first 3 words of each sentence segment or CAPS-heavy words
    const isKeyword = isReveal || w.word === w.word.toUpperCase() && w.word.length > 2;
    return { ...w, isReveal: w.isReveal ?? isReveal, isKeyword: w.isKeyword ?? isKeyword };
  });
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────

interface DrawState {
  flashAlpha: number;   // 0-1 for reveal flash overlay
  zoomScale: number;    // current active-word zoom (1.0–1.2)
  lastActiveIdx: number;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: number,
  words: TimelineWord[],
  w: number,
  h: number,
  styleKey: string,
  isRTL: boolean,
  missionTitle: string,
  highlightColor: string,
  drawState: DrawState,
  showRevealFlash: boolean,
): DrawState {
  const t = frame / FPS;
  const bg = STYLE_BG[styleKey] ?? '#0a0a0a';
  const accent = highlightColor || STYLE_ACCENT[styleKey] || '#EA580C';

  // Decay flash and zoom each frame
  const newFlash = Math.max(0, drawState.flashAlpha - 0.07);
  let newZoom = drawState.zoomScale + (1.0 - drawState.zoomScale) * 0.25; // spring toward 1.0

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Vignette
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Find active word
  const activeIdx = words.findIndex((ww) => t >= ww.start && t <= ww.end);
  const activeWord = activeIdx >= 0 ? words[activeIdx] : null;

  // Detect new word activation → trigger flash + zoom
  let updatedLastIdx = drawState.lastActiveIdx;
  let updatedFlash = newFlash;
  if (activeIdx !== drawState.lastActiveIdx && activeIdx >= 0) {
    updatedLastIdx = activeIdx;
    if (showRevealFlash && activeWord?.isReveal) {
      updatedFlash = 0.35; // Reveal Flash: orange overlay
    }
    if (activeWord?.isKeyword) {
      newZoom = 1.2; // Keyword zoom snap
    }
  }

  // Apply zoom transform centered on caption area
  const captionY = h * 0.82;
  if (newZoom > 1.001) {
    ctx.save();
    ctx.translate(w / 2, captionY);
    ctx.scale(newZoom, newZoom);
    ctx.translate(-w / 2, -captionY);
  }

  // Caption window — 5-word sliding
  const windowStart = Math.max(0, activeIdx - 2);
  const windowEnd = Math.min(words.length, windowStart + 5);
  const windowWords = words.slice(windowStart, windowEnd);

  if (windowWords.length > 0) {
    const baseFontSize = Math.round(w * 0.07);
    ctx.font = `900 ${baseFontSize}px "Geist", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const totalWidth = windowWords.reduce((sum, ww, i) => {
      return sum + ctx.measureText(ww.word).width + (i < windowWords.length - 1 ? baseFontSize * 0.35 : 0);
    }, 0);

    let x = w / 2 - totalWidth / 2;

    for (let i = 0; i < windowWords.length; i++) {
      const ww = windowWords[i];
      const wordIdx = windowStart + i;
      const isActive = wordIdx === activeIdx;
      const metrics = ctx.measureText(ww.word);
      const wordCenterX = x + metrics.width / 2;

      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = isActive ? 20 : 12;

      if (isActive) {
        // Hormozi active: UPPERCASE + orange + 8% bigger
        const activeFontSize = Math.round(baseFontSize * 1.08);
        ctx.font = `900 ${activeFontSize}px "Geist", system-ui, sans-serif`;
        ctx.fillStyle = accent;
      } else {
        ctx.font = `900 ${baseFontSize}px "Geist", system-ui, sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
      }

      ctx.fillText(isActive ? ww.word.toUpperCase() : ww.word, wordCenterX, captionY);
      x += metrics.width + baseFontSize * 0.35;
    }
    ctx.shadowBlur = 0;
  }

  if (newZoom > 1.001) ctx.restore();

  // Mission title at rest
  if (words.length === 0 || t < (words[0]?.start ?? 0)) {
    ctx.save();
    ctx.font = `700 ${Math.round(w * 0.045)}px "Geist", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(missionTitle, w / 2, h * 0.82);
    ctx.restore();
  }

  // Ghost Creator badge — top-left
  ctx.save();
  const badgeR = 6, badgePad = 10;
  const badgeFontSize = Math.round(w * 0.032);
  ctx.font = `700 ${badgeFontSize}px "Geist Mono", monospace`;
  const badgeText = 'GHOST CREATOR';
  const bw = ctx.measureText(badgeText).width + badgePad * 2;
  const bh = badgeFontSize + badgePad;
  const bx = 16, by = 20;
  ctx.fillStyle = `${accent}18`;
  roundRect(ctx, bx, by, bw, bh, badgeR); ctx.fill();
  ctx.strokeStyle = `${accent}40`; ctx.lineWidth = 1;
  roundRect(ctx, bx, by, bw, bh, badgeR); ctx.stroke();
  ctx.fillStyle = accent; ctx.textAlign = 'left';
  ctx.fillText(badgeText, bx + badgePad, by + bh / 2 + badgeFontSize * 0.35);
  ctx.restore();

  // Reveal Flash overlay — full-canvas orange wash (Barber Logic)
  if (updatedFlash > 0.005 && showRevealFlash) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(234,88,12,${updatedFlash * 0.6})`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // Flash vignette punch
    const flashGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.5);
    flashGrad.addColorStop(0, `rgba(234,88,12,${updatedFlash * 0.25})`);
    flashGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flashGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Progress bar
  ctx.save();
  const barH = 3;
  const totalDur = words.length > 0 ? (words[words.length - 1]?.end ?? 1) : 1;
  const progress = Math.min(t / totalDur, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, h - barH, w, barH);
  ctx.fillStyle = accent;
  ctx.fillRect(0, h - barH, w * progress, barH);
  ctx.restore();

  return { flashAlpha: updatedFlash, zoomScale: newZoom, lastActiveIdx: updatedLastIdx };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ─── Timeline scrubber ────────────────────────────────────────────────────────

function Scrubber({
  frame, totalFrames, isPlaying, onSeek, onTogglePlay,
}: {
  frame: number; totalFrames: number; isPlaying: boolean;
  onSeek: (f: number) => void; onTogglePlay: () => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const progress = totalFrames > 0 ? frame / totalFrames : 0;
  const timecode = `${String(Math.floor(frame / FPS / 60)).padStart(2, '0')}:${String(Math.floor(frame / FPS) % 60).padStart(2, '0')}:${String(frame % FPS).padStart(2, '0')}`;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    onSeek(Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * totalFrames));
  }, [totalFrames, onSeek]);

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5 backdrop-blur-xl border-t" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div ref={barRef} className="relative h-1 rounded-full cursor-pointer" style={{ background: 'rgba(255,255,255,0.08)' }} onClick={handleClick}>
        <div className="absolute left-0 top-0 h-full rounded-full transition-none" style={{ width: `${progress * 100}%`, background: '#EA580C' }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full -translate-x-1/2" style={{ left: `${progress * 100}%`, background: '#EA580C', boxShadow: '0 0 6px rgba(234,88,12,0.8)' }} />
      </div>
      <div className="flex items-center justify-between">
        <button onClick={onTogglePlay} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {isPlaying ? (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
              <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="rgba(255,255,255,0.6)">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <span className="text-[9px] font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.25)' }}>{timecode}</span>
        <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>{FPS}fps</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RemotionCanvas({
  words = [],
  duration,
  styleKey = 'barber',
  isRTL = false,
  missionTitle = '',
  highlightColor = '#EA580C',
  className = '',
  showRevealFlash = true,
  transitionSpeed: _transitionSpeed = 0.12,
}: RemotionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const drawStateRef = useRef<DrawState>({ flashAlpha: 0, zoomScale: 1.0, lastActiveIdx: -1 });
  const [displayFrame, setDisplayFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Pre-process words to mark reveals + keywords
  const processedWords = markRevealWords(words);

  const totalDuration = duration ?? (words.length > 0 ? Math.ceil(words[words.length - 1]?.end ?? 0) + 0.5 : 30);
  const totalFrames = Math.ceil(totalDuration * FPS);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawStateRef.current = drawFrame(
      ctx, frameRef.current, processedWords,
      canvas.width, canvas.height,
      styleKey, isRTL, missionTitle, highlightColor,
      drawStateRef.current, showRevealFlash,
    );
    setDisplayFrame(frameRef.current);
  }, [processedWords, styleKey, isRTL, missionTitle, highlightColor, showRevealFlash]);

  // RAF playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      if (delta >= 1000 / FPS) {
        lastTimeRef.current = now;
        frameRef.current += 1;
        if (frameRef.current >= totalFrames) {
          frameRef.current = 0;
          setIsPlaying(false);
          render();
          return;
        }
        render();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, totalFrames, render]);

  useEffect(() => {
    drawStateRef.current = { flashAlpha: 0, zoomScale: 1.0, lastActiveIdx: -1 };
    render();
  }, [render]);

  const handleSeek = useCallback((f: number) => {
    frameRef.current = f;
    drawStateRef.current = { flashAlpha: 0, zoomScale: 1.0, lastActiveIdx: -1 };
    render();
  }, [render]);

  const handleTogglePlay = useCallback(() => {
    if (frameRef.current >= totalFrames - 1) frameRef.current = 0;
    setIsPlaying((p) => !p);
  }, [totalFrames]);

  const W = 280;
  const H = Math.round(W * 16 / 9);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className={`flex flex-col overflow-hidden rounded-3xl ${className}`}
      style={{
        width: W,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 0 60px rgba(234,88,12,0.08), 0 32px 80px rgba(0,0,0,0.7)',
      }}
    >
      <canvas ref={canvasRef} width={W} height={H} className="block" style={{ imageRendering: 'pixelated' }} />
      <Scrubber frame={displayFrame} totalFrames={totalFrames} isPlaying={isPlaying} onSeek={handleSeek} onTogglePlay={handleTogglePlay} />
    </motion.div>
  );
}

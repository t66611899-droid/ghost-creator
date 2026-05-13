'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transition } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PreviewWord {
  word: string;
  start: number;
  end: number;
}

interface PreviewCanvasProps {
  videoFile?: File | null;
  words?: PreviewWord[];
  currentTime?: number;
  styleKey?: string;
  isRTL?: boolean;
  missionTitle?: string;
  day?: number;
}

// Spring config — stiffness 100, damping 20
const spring: Transition = { type: 'spring', stiffness: 100, damping: 20 };

// ─── Active word caption logic ────────────────────────────────────────────────

function useActiveCaption(words: PreviewWord[], currentTime: number) {
  const active = words.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end
  );
  return { activeIndex: active, activeWord: active >= 0 ? words[active] : null };
}

// ─── Video overlay captions ───────────────────────────────────────────────────

function CaptionOverlay({
  words,
  currentTime,
  isRTL,
}: {
  words: PreviewWord[];
  currentTime: number;
  isRTL: boolean;
}) {
  const { activeIndex } = useActiveCaption(words, currentTime);
  if (activeIndex < 0 || words.length === 0) return null;

  // Show window of 5 words around active
  const start = Math.max(0, activeIndex - 2);
  const end = Math.min(words.length, start + 5);
  const window = words.slice(start, end);

  return (
    <div
      className="absolute bottom-[12%] left-0 right-0 flex flex-wrap justify-center gap-x-1.5 gap-y-1 px-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {window.map((w, i) => {
        const wordIndex = start + i;
        const isActive = wordIndex === activeIndex;
        return (
          <motion.span
            key={`${w.word}-${wordIndex}`}
            animate={isActive ? { scale: 1.1 } : { scale: 1 }}
            transition={spring}
            className={`font-black text-lg leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] ${
              isActive
                ? 'text-[#EA580C]'
                : 'text-white opacity-70'
            }`}
            style={isRTL ? { fontFamily: 'var(--font-rubik)' } : { textTransform: 'uppercase' }}
          >
            {w.word}
          </motion.span>
        );
      })}
    </div>
  );
}

// ─── Style presets ─────────────────────────────────────────────────────────────

const STYLE_GRADIENTS: Record<string, string> = {
  barber: 'from-[#0a0a0a] via-[#111] to-[#0a0a0a]',
  gym: 'from-[#0a0a0a] via-[#0d0a00] to-[#0a0a0a]',
  hvac: 'from-[#0a0a0a] via-[#00080d] to-[#0a0a0a]',
  minimal: 'from-[#050505] via-[#0a0a0a] to-[#050505]',
  vibrant: 'from-[#0a0a0a] via-[#100508] to-[#0a0a0a]',
};

// ─── Main PreviewCanvas ───────────────────────────────────────────────────────

export default function PreviewCanvas({
  videoFile,
  words = [],
  currentTime = 0,
  styleKey = 'barber',
  isRTL = false,
  missionTitle,
  day,
}: PreviewCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Create object URL for video file
  useEffect(() => {
    if (!videoFile) {
      setVideoUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const gradient = STYLE_GRADIENTS[styleKey] ?? STYLE_GRADIENTS.barber;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className="relative flex-shrink-0"
      style={{
        width: '100%',
        maxWidth: 280,
        aspectRatio: '9 / 16',
      }}
    >
      {/* Glass frame */}
      <div
        className="absolute inset-0 rounded-3xl backdrop-blur-2xl bg-white/[0.04] border border-white/[0.1] overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(234,88,12,0.08), 0 32px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-b ${gradient}`} />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          }}
        />

        {/* Video layer */}
        <AnimatePresence>
          {videoUrl ? (
            <motion.video
              key="video"
              ref={videoRef}
              src={videoUrl}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: isLoaded ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              onLoadedData={() => setIsLoaded(true)}
              playsInline
              muted
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            >
              {/* Phone notch decoration */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-white/10" />

              {/* Day badge */}
              {day !== undefined && (
                <div className="absolute top-8 left-4">
                  <span className="text-[9px] font-bold text-[#EA580C] bg-[#EA580C]/10 border border-[#EA580C]/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
                    Day {day}
                  </span>
                </div>
              )}

              {/* Center placeholder */}
              <div className="flex flex-col items-center gap-2 opacity-40">
                <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                  </svg>
                </div>
                <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest">
                  No footage
                </p>
              </div>

              {/* Mission title at bottom */}
              {missionTitle && (
                <div className="absolute bottom-12 left-4 right-4">
                  <p
                    className="text-white text-xs font-black leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] text-center"
                    dir={isRTL ? 'rtl' : 'ltr'}
                    style={isRTL ? { fontFamily: 'var(--font-rubik)' } : { textTransform: 'uppercase' }}
                  >
                    {missionTitle}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caption overlay (live words) */}
        {words.length > 0 && (
          <CaptionOverlay words={words} currentTime={currentTime} isRTL={isRTL} />
        )}

        {/* Bottom safe area glow */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* 9:16 label */}
        <div className="absolute top-3 right-3">
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-wider">9:16</span>
        </div>
      </div>

      {/* Floating glow below */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-6 blur-xl pointer-events-none"
        style={{ background: 'rgba(234,88,12,0.15)' }}
      />
    </motion.div>
  );
}

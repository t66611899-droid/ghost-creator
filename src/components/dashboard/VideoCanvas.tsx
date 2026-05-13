'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Upload } from 'lucide-react';

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface VideoCanvasProps {
  words?: WordTimestamp[];
  videoSrc?: string;
  isRTL?: boolean;
  highlightColor?: string;
  onFileSelect?: (file: File) => void;
}

function buildCueGroups(words: WordTimestamp[], size: number): WordTimestamp[][] {
  const groups: WordTimestamp[][] = [];
  for (let i = 0; i < words.length; i += size) {
    groups.push(words.slice(i, i + size));
  }
  return groups;
}

export default function VideoCanvas({
  words = [],
  videoSrc,
  isRTL = false,
  highlightColor = '#ea580c',
  onFileSelect,
}: VideoCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeWordStart, setActiveWordStart] = useState<number | null>(null);
  const [activeCue, setActiveCue] = useState<WordTimestamp[]>([]);

  const cueGroups = buildCueGroups(words, 4);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const t = video.currentTime;

      // Active word for per-word highlight
      const activeWord = words.find((w) => t >= w.start && t <= w.end) ?? null;
      setActiveWordStart(activeWord?.start ?? null);

      // Active cue group
      const cue =
        cueGroups.find((g) => t >= g[0].start && t <= g[g.length - 1].end) ?? [];
      setActiveCue(cue);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [words, cueGroups]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) { v.pause(); setIsPlaying(false); }
    else { v.play(); setIsPlaying(true); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = Array.from(e.dataTransfer.files).find(
      (f) => f.type.startsWith('video/') || f.type.startsWith('audio/')
    );
    if (file) onFileSelect?.(file);
  };

  return (
    <div className="relative w-full" style={{ aspectRatio: '9 / 16' }}>
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden border border-[#222] bg-[#111]"
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#ea580c] bg-[#ea580c]/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Upload className="w-8 h-8 text-[#ea580c] mb-2" />
              <span className="text-sm text-[#ea580c] font-medium">Drop to load</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video element */}
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#4a4a4a]">
            <div className="w-12 h-12 rounded-xl border border-[#2a2a2a] flex items-center justify-center">
              <Play className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium tracking-wider uppercase">9:16 Preview</span>
            <span className="text-[10px] text-[#333]">Drop a video or upload above</span>
          </div>
        )}

        {/* Caption overlay — Hormozi style, RTL-aware */}
        <AnimatePresence mode="wait">
          {activeCue.length > 0 && (
            <motion.div
              key={activeCue[0].start}
              className="absolute bottom-16 left-0 right-0 px-4 flex flex-wrap justify-center gap-x-1.5"
              dir={isRTL ? 'rtl' : 'ltr'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
            >
              {activeCue.map((w, i) => {
                const isActive = activeWordStart === w.start;
                return (
                  <motion.span
                    key={i}
                    className={`font-black text-2xl leading-tight ${isRTL ? 'font-[family-name:var(--font-rubik)]' : 'uppercase'}`}
                    style={{
                      color: isActive ? highlightColor : '#ffffff',
                      textShadow: isActive
                        ? `0 0 20px ${highlightColor}99, 0 2px 10px rgba(0,0,0,0.95)`
                        : '0 2px 10px rgba(0,0,0,0.95)',
                      transition: 'color 0.04s, text-shadow 0.04s',
                    }}
                  >
                    {w.word}
                  </motion.span>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Play/pause */}
        {videoSrc && (
          <button
            onClick={togglePlay}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-black/60 border border-[#333] backdrop-blur-sm flex items-center justify-center hover:bg-[#ea580c]/20 hover:border-[#ea580c] transition-all"
          >
            {isPlaying
              ? <Pause className="w-4 h-4 text-white" />
              : <Play className="w-4 h-4 text-white ml-0.5" />}
          </button>
        )}

        {/* Corner badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1 border border-[#222]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse" />
          <span className="text-[10px] font-semibold text-[#ea580c] tracking-wider uppercase">
            {isRTL ? 'RTL · 9:16' : '9:16'}
          </span>
        </div>
      </div>
    </div>
  );
}

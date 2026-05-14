'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { Play, Pause, VolumeX, Volume2 } from 'lucide-react';

const spring: Transition = { type: 'spring', stiffness: 100, damping: 20 };

interface VideoPreviewProps {
  src?: string;             // object URL of the uploaded blob
  poster?: string;          // optional thumbnail
  className?: string;
  width?: number;
}

/**
 * Renders an actual video blob in a 9:16 luxury frame.
 * No demo captions, no synthetic timeline — just the real footage.
 */
export default function VideoPreview({
  src,
  poster,
  className = '',
  width = 300,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const H = Math.round(width * 16 / 9);

  // Reset playback when source changes
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setProgress(v.currentTime);
    const onDur = () => setDuration(isFinite(v.duration) ? v.duration : 0);
    const onEnd = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onDur);
    v.addEventListener('durationchange', onDur);
    v.addEventListener('ended', onEnd);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onDur);
      v.removeEventListener('durationchange', onDur);
      v.removeEventListener('ended', onEnd);
    };
  }, [src]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * duration;
  };

  const tc = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  const progressRatio = duration ? progress / duration : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      className={`flex flex-col overflow-hidden rounded-2xl ${className}`}
      style={{
        width,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow:
          '0 24px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.10) inset, 0 0 32px rgba(255,255,255,0.04)',
      }}
    >
      {/* Video frame */}
      <div
        className="relative"
        style={{ width, height: H, background: '#000', overflow: 'hidden' }}
      >
        {src ? (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            muted={muted}
            playsInline
            preload="metadata"
            onClick={toggle}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer',
              display: 'block',
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <Play className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.55)' }} />
            </div>
            <p
              className="text-base"
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontFamily: 'var(--font-cormorant), serif',
                fontStyle: 'italic',
              }}
            >
              Drop a clip to preview
            </p>
          </div>
        )}

        {/* Play / pause overlay */}
        {src && !playing && (
          <button
            onClick={toggle}
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.30)' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Play className="w-5 h-5 ml-0.5" style={{ color: '#FFFFFF' }} />
            </div>
          </button>
        )}
      </div>

      {/* Scrubber */}
      {src && (
        <div
          className="flex flex-col gap-2 px-3 py-2.5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Progress bar */}
          <div
            className="relative h-1 rounded-full cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            onClick={seek}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{
                width: `${progressRatio * 100}%`,
                background:
                  'linear-gradient(90deg, #D4D4D4 0%, #FFFFFF 50%, #D4D4D4 100%)',
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
              style={{
                left: `${progressRatio * 100}%`,
                background: '#FFFFFF',
                boxShadow: '0 0 8px rgba(255,255,255,0.6)',
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={toggle}
              className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              {playing
                ? <Pause className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.80)' }} />
                : <Play className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.80)' }} />}
            </button>

            <span
              className="text-[10px] tabular-nums tracking-wider"
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontFamily: 'var(--font-inter), sans-serif',
              }}
            >
              {tc(progress)} / {tc(duration)}
            </span>

            <button
              onClick={toggleMute}
              className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              {muted
                ? <VolumeX className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.50)' }} />
                : <Volume2 className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.80)' }} />}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

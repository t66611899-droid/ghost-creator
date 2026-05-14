'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Transition } from 'framer-motion';

const spring: Transition = { type: 'spring', stiffness: 120, damping: 22 };

interface ProcessingOverlayProps {
  visible: boolean;
  phase?: string;
  progress?: number;   // 0..1, optional
  detail?: string;
}

/**
 * High-end silver loader. Sits over the entire app while processing.
 * Locked palette: Carbon, Chrome, Pure White.
 */
export default function ProcessingOverlay({
  visible,
  phase = 'Processing',
  progress,
  detail,
}: ProcessingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="processing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            background: 'rgba(10,10,10,0.86)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={spring}
            className="flex flex-col items-center gap-8 px-12 py-10 rounded-3xl"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow:
                '0 32px 80px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.10) inset',
              minWidth: 320,
            }}
          >
            {/* Chrome ring loader */}
            <div className="relative" style={{ width: 84, height: 84 }}>
              {/* Outer chrome ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.18) 75%, rgba(255,255,255,0) 100%)',
                  WebkitMask:
                    'radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px))',
                  mask:
                    'radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 6px))',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              />

              {/* Inner subtle ring (counter-rotates) */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: 12,
                  background:
                    'conic-gradient(from 180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0) 100%)',
                  WebkitMask:
                    'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
                  mask:
                    'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
              />

              {/* Center chrome dot */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: 34,
                  background:
                    'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D4D4D4 40%, #888 100%)',
                  boxShadow:
                    '0 0 12px rgba(255,255,255,0.45), 0 2px 4px rgba(0,0,0,0.4)',
                }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            {/* Phase label — Cormorant italic for editorial feel */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p
                className="text-2xl tracking-tight"
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-cormorant), serif',
                  fontWeight: 400,
                  letterSpacing: '0.005em',
                }}
              >
                {phase}
              </p>
              {detail && (
                <p
                  className="text-[11px] tracking-[0.18em] uppercase"
                  style={{
                    color: 'rgba(255,255,255,0.45)',
                    fontFamily: 'var(--font-inter), sans-serif',
                  }}
                >
                  {detail}
                </p>
              )}
            </div>

            {/* Progress bar (optional) */}
            {typeof progress === 'number' && (
              <div className="w-full flex flex-col gap-2" style={{ width: 240 }}>
                <div
                  className="h-[2px] rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        'linear-gradient(90deg, #888 0%, #FFFFFF 50%, #888 100%)',
                    }}
                    animate={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <span
                  className="text-[10px] tabular-nums tracking-widest text-center"
                  style={{
                    color: 'rgba(255,255,255,0.35)',
                    fontFamily: 'var(--font-inter), sans-serif',
                  }}
                >
                  {Math.round(progress * 100)}%
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

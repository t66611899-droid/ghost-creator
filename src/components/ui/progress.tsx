'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  delay?: number;
}

export function Progress({
  value,
  max = 100,
  className,
  trackClassName,
  barClassName,
  delay = 0,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]', trackClassName, className)}
      aria-valuenow={value}
      aria-valuemax={max}
      role="progressbar"
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400',
          barClassName,
        )}
      />
    </div>
  );
}

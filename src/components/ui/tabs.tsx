'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors',
              active ? 'text-white' : 'text-white/60 hover:text-white/90',
            )}
          >
            {active && (
              <motion.span
                layoutId="tab-active-indicator"
                className="absolute inset-0 rounded-lg bg-white/[0.08] ring-1 ring-white/10 shadow-inner"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'relative rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  active ? 'bg-white/15 text-white' : 'bg-white/[0.06] text-white/50',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

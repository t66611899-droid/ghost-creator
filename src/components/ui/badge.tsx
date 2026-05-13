import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const TONE: Record<Tone, string> = {
  neutral: 'bg-white/[0.06] text-white/80 border-white/10',
  success: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
  warning: 'bg-amber-500/12 text-amber-300 border-amber-500/25',
  danger: 'bg-red-500/12 text-red-300 border-red-500/25',
  info: 'bg-sky-500/12 text-sky-300 border-sky-500/25',
  accent: 'bg-purple-500/12 text-purple-300 border-purple-500/25',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase',
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}

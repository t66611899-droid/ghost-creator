import { cn } from '@/lib/utils';

interface AvatarProps {
  initials: string;
  className?: string;
  gradient?: { from: string; to: string };
}

export function Avatar({ initials, className, gradient }: AvatarProps) {
  const style = gradient
    ? { backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }
    : undefined;
  return (
    <div
      style={style}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ring-1 ring-white/15',
        !gradient && 'bg-gradient-to-br from-slate-700 to-slate-900',
        className,
      )}
    >
      {initials}
    </div>
  );
}

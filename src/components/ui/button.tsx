import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-purple-400',
  secondary:
    'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1]',
  ghost: 'text-white/70 hover:text-white hover:bg-white/[0.06]',
  destructive:
    'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25',
  outline:
    'bg-transparent text-white border border-white/15 hover:border-white/30 hover:bg-white/[0.04]',
};

const SIZE: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2',
  icon: 'h-9 w-9 rounded-lg justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 disabled:opacity-50 disabled:pointer-events-none',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

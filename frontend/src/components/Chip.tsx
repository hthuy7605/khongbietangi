import type { ButtonHTMLAttributes } from 'react';
import { cn } from 'cn';

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  active?: boolean;
  onClick?: () => void;
}

export function Chip({ active = false, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-input bg-card text-foreground hover:bg-accent',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

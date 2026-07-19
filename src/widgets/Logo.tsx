import { Zap } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="Called It"
      className={cn(
        'font-display text-foreground inline-flex items-center font-black tracking-tight uppercase select-none',
        compact ? 'gap-0.5 text-lg' : 'gap-1 text-3xl',
        className,
      )}
    >
      <span aria-hidden="true">CALLED</span>
      <Zap
        aria-hidden="true"
        className={cn('text-lime shrink-0', compact ? 'size-4' : 'size-7')}
        strokeWidth={2.5}
        fill="currentColor"
      />
      <span aria-hidden="true">T</span>
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <Zap
      aria-label="Called It"
      role="img"
      className={cn('text-lime', className)}
      strokeWidth={2.5}
      fill="currentColor"
    />
  );
}

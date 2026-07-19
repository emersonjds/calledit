import { formatSol } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';

interface StakeSelectorProps {
  value: number;
  balanceSol: number;
  onChange: (value: number) => void;
}

const QUICK_PICKS = [0.02, 0.05, 0.1, 0.25] as const;

export function StakeSelector({ value, balanceSol, onChange }: StakeSelectorProps) {
  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide">STAKE (SOL)</p>
        <p className="text-muted-foreground text-xs">Balance: {formatSol(balanceSol)}</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {QUICK_PICKS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onChange(amount)}
            className={cn(
              'rounded-lg border py-2 font-mono text-sm font-semibold transition-colors',
              value === amount
                ? 'border-lime bg-lime/10 text-lime'
                : 'border-border text-foreground hover:border-border/80',
            )}
          >
            {amount}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(balanceSol)}
          className={cn(
            'rounded-lg border py-2 font-mono text-sm font-semibold transition-colors',
            value === balanceSol
              ? 'border-lime bg-lime/10 text-lime'
              : 'border-border text-foreground hover:border-border/80',
          )}
        >
          MAX
        </button>
      </div>
    </div>
  );
}

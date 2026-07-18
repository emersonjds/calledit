import { Flame } from 'lucide-react';
import { streakBonus } from '@/entities/prediction';
import { formatMultiplier } from '@/shared/lib/format';

interface StreakBannerProps {
  streak: number;
}

export function StreakBanner({ streak }: StreakBannerProps) {
  if (streak === 0) {
    return (
      <div className="border-border bg-card text-muted-foreground flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
        <Flame className="size-4" />
        Build a streak to boost payouts
      </div>
    );
  }

  const multiplier = formatMultiplier(streakBonus(streak));

  return (
    <div className="border-flame/40 bg-card glow-flame flex items-center justify-between rounded-xl border px-4 py-3">
      <div className="flex items-center gap-2">
        <Flame className="text-flame size-5" />
        <span className="font-display text-foreground text-sm font-bold tracking-wide">
          {streak} IN A ROW
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-flame font-mono text-lg font-bold">{multiplier}</span>
        <span className="text-muted-foreground text-[10px] font-semibold tracking-wide">
          STREAK BONUS
        </span>
      </div>
    </div>
  );
}

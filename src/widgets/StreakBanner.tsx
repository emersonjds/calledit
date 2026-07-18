import { Flame } from "lucide-react";
import { streakBonus } from "@/entities/prediction";
import { formatMultiplier } from "@/shared/lib/format";

interface StreakBannerProps {
  streak: number;
}

export function StreakBanner({ streak }: StreakBannerProps) {
  if (streak === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Flame className="size-4" />
        Build a streak to boost payouts
      </div>
    );
  }

  const multiplier = formatMultiplier(streakBonus(streak));

  return (
    <div className="flex items-center justify-between rounded-xl border border-flame/40 bg-card px-4 py-3 glow-flame">
      <div className="flex items-center gap-2">
        <Flame className="size-5 text-flame" />
        <span className="font-display text-sm font-bold tracking-wide text-foreground">{streak} IN A ROW</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-mono text-lg font-bold text-flame">{multiplier}</span>
        <span className="text-[10px] font-semibold tracking-wide text-muted-foreground">STREAK BONUS</span>
      </div>
    </div>
  );
}

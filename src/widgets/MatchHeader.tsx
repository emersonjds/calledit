import type { Period, TeamInfo } from "@/entities/match";
import { periodLabel } from "@/entities/match";
import { formatClock } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

interface MatchHeaderProps {
  home: TeamInfo;
  away: TeamInfo;
  score: [number, number];
  clockMin: number;
  period: Period;
  live: boolean;
}

export function MatchHeader({ home, away, score, clockMin, period, live }: MatchHeaderProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
      <TeamTag team={home} />
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-3xl font-bold text-foreground">
          {score[0]} - {score[1]}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {live && (
            <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-1.5 py-0.5 font-semibold text-destructive animate-pulse-live">
              <span className="size-1.5 rounded-full bg-destructive" />
              LIVE
            </span>
          )}
          <span className="font-mono">{formatClock(clockMin)}</span>
          <span>{periodLabel(period)}</span>
        </div>
      </div>
      <TeamTag team={away} reverse />
    </div>
  );
}

function TeamTag({ team, reverse }: { team: TeamInfo; reverse?: boolean }) {
  return (
    <div className={cn("flex items-center gap-1.5", reverse && "flex-row-reverse")}>
      <span className="text-xl leading-none">{team.flag}</span>
      <span className="font-display text-sm font-bold tracking-wide text-foreground">{team.code}</span>
    </div>
  );
}

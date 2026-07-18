import type { Period, TeamInfo } from '@/entities/match';
import { periodLabel } from '@/entities/match';
import { formatClock } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';

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
    <div className="border-border bg-card flex items-center justify-between rounded-xl border px-4 py-3">
      <TeamTag team={home} />
      <div className="flex flex-col items-center gap-1">
        <span className="text-foreground font-mono text-3xl font-bold">
          {score[0]} - {score[1]}
        </span>
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          {live && (
            <span className="bg-destructive/15 text-destructive animate-pulse-live flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold">
              <span className="bg-destructive size-1.5 rounded-full" />
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
    <div className={cn('flex items-center gap-1.5', reverse && 'flex-row-reverse')}>
      <span className="text-xl leading-none">{team.flag}</span>
      <span className="font-display text-foreground text-sm font-bold tracking-wide">
        {team.code}
      </span>
    </div>
  );
}

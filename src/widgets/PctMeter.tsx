import type { TeamInfo, WinProbability } from '@/entities/match';

interface PctMeterProps {
  pct: WinProbability;
  home: TeamInfo;
  away: TeamInfo;
}

export function PctMeter({ pct, home, away }: PctMeterProps) {
  const homePct = Math.round(pct.home * 100);
  const drawPct = Math.round(pct.draw * 100);
  const awayPct = Math.round(pct.away * 100);

  return (
    <div className="border-border bg-card rounded-xl border p-4">
      <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide">
        WIN PROBABILITY
      </p>
      <div className="bg-muted flex h-2.5 w-full overflow-hidden rounded-full">
        <div className="bg-lime h-full" style={{ width: `${homePct}%` }} />
        <div className="bg-muted-foreground/40 h-full" style={{ width: `${drawPct}%` }} />
        <div className="bg-flame h-full" style={{ width: `${awayPct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="text-lime flex items-center gap-1">
          <span className="font-semibold">{home.code}</span>
          <span className="font-mono">{homePct}%</span>
        </span>
        <span className="text-muted-foreground flex items-center gap-1">
          <span className="font-semibold">Draw</span>
          <span className="font-mono">{drawPct}%</span>
        </span>
        <span className="text-flame flex items-center gap-1">
          <span className="font-mono">{awayPct}%</span>
          <span className="font-semibold">{away.code}</span>
        </span>
      </div>
    </div>
  );
}

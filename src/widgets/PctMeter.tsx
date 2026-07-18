import type { TeamInfo, WinProbability } from "@/entities/match";

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
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground">WIN PROBABILITY</p>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-lime" style={{ width: `${homePct}%` }} />
        <div className="h-full bg-muted-foreground/40" style={{ width: `${drawPct}%` }} />
        <div className="h-full bg-flame" style={{ width: `${awayPct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="flex items-center gap-1 text-lime">
          <span className="font-semibold">{home.code}</span>
          <span className="font-mono">{homePct}%</span>
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className="font-semibold">Draw</span>
          <span className="font-mono">{drawPct}%</span>
        </span>
        <span className="flex items-center gap-1 text-flame">
          <span className="font-mono">{awayPct}%</span>
          <span className="font-semibold">{away.code}</span>
        </span>
      </div>
    </div>
  );
}

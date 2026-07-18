import type { MatchEvent, MatchEventType } from "@/entities/match";
import { formatClock } from "@/shared/lib/format";

interface EventTickerProps {
  events: MatchEvent[];
}

const EVENT_ICON: Record<MatchEventType, string> = {
  goal: "⚽",
  yellow: "🟨",
  red: "🟥",
  corner: "🚩",
  foul: "🦶",
  sub: "🔄",
  var: "📺",
};

const EVENT_LABEL: Record<MatchEventType, string> = {
  goal: "Goal",
  yellow: "Card",
  red: "Red card",
  corner: "Corner",
  foul: "Foul",
  sub: "Sub",
  var: "VAR",
};

export function EventTicker({ events }: EventTickerProps) {
  if (events.length === 0) {
    return <p className="px-4 py-2 text-xs text-muted-foreground">No events yet.</p>;
  }

  // feed is chronological; the ticker reads newest-first
  const newestFirst = [...events].sort((a, b) => b.clockMin - a.clockMin);

  return (
    <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap px-4 py-2 text-xs text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {newestFirst.map((event) => (
        <span key={event.id} className="flex shrink-0 items-center gap-1">
          <span>{EVENT_ICON[event.type]}</span>
          <span>{EVENT_LABEL[event.type]}</span>
          <span className="font-mono text-foreground/80">{formatClock(event.clockMin)}</span>
        </span>
      ))}
    </div>
  );
}

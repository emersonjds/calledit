import { CalendarDays, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatCountdown, formatKickoff } from "@/shared/lib/format";
import { useUpcomingFixtures } from "@/features/fixtures";
import type { Fixture } from "@/entities/fixture";

export function MatchesPage() {
  const fixtures = useUpcomingFixtures();
  const items = fixtures.data ?? [];

  return (
    <div className="space-y-4 px-4 py-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-5 text-lime" />
        <h1 className="font-display text-xl font-bold">Upcoming Matches</h1>
      </div>
      <p className="text-xs text-muted-foreground">Next 5 World Cup fixtures</p>

      {fixtures.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <p className="pt-10 text-center text-sm text-muted-foreground">
          No upcoming fixtures right now. Check back soon.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((fixture) => (
            <FixtureCard key={fixture.id} fixture={fixture} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FixtureCardProps {
  fixture: Fixture;
}

function FixtureCard({ fixture }: FixtureCardProps) {
  return (
    <button
      type="button"
      onClick={() => toast("Predictions open at kickoff")}
      className="w-full space-y-3 rounded-2xl border border-border bg-card px-4 py-4 text-left transition-colors hover:border-lime/40"
    >
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="border-lime/50 text-lime">
          {fixture.stage}
        </Badge>
        <span className="font-mono text-xs text-muted-foreground">
          {formatCountdown(fixture.kickoff, Date.now())}
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 font-display text-lg font-bold">
        <span className="flex items-center gap-2">
          <span className="text-2xl">{fixture.home.flag}</span>
          {fixture.home.code}
        </span>
        <span className="text-sm font-normal text-muted-foreground">vs</span>
        <span className="flex items-center gap-2">
          {fixture.away.code}
          <span className="text-2xl">{fixture.away.flag}</span>
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex shrink-0 items-center gap-1.5">
          <Clock className="size-3.5" /> {formatKickoff(fixture.kickoff)}
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{fixture.venue}</span>
        </span>
      </div>
    </button>
  );
}

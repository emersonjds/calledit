import { Clock, MapPin, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { formatKickoff } from '@/shared/lib/format';
import { useMatchList } from '@/features/fixtures';
import { useSession } from '@/store/session';
import type { MatchCard } from '@/entities/fixture';

export function MatchesPage() {
  const matches = useMatchList();
  const items = matches.data ?? [];
  const live = items.filter((match) => match.status === 'live');
  const recent = items.filter((match) => match.status === 'finished');
  const navigate = useNavigate();
  const selectMatch = useSession((state) => state.selectMatch);

  const openLive = (id: string) => {
    selectMatch(id);
    navigate('/');
  };

  if (matches.isLoading) {
    return (
      <div className="space-y-3 px-4 py-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-4">
      {live.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="text-flame size-5" />
            <h1 className="font-display text-xl font-bold">Live now</h1>
          </div>
          {live.map((match) => (
            <MatchRow key={match.id} match={match} onOpen={() => openLive(match.id)} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="text-lime size-5" />
          <h2 className="font-display text-xl font-bold">Recent results</h2>
        </div>
        {recent.length === 0 ? (
          <p className="text-muted-foreground pt-6 text-center text-sm">
            No finished matches yet. Check back after kickoff.
          </p>
        ) : (
          recent.map((match) => <MatchRow key={match.id} match={match} />)
        )}
      </section>
    </div>
  );
}

interface MatchRowProps {
  match: MatchCard;
  onOpen?: () => void;
}

function MatchRow({ match, onOpen }: MatchRowProps) {
  const isLive = match.status === 'live';
  const content = (
    <>
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={isLive ? 'border-flame/60 text-flame' : 'border-lime/50 text-lime'}
        >
          {match.stage}
        </Badge>
        {isLive ? (
          <span className="text-flame flex items-center gap-1.5 font-mono text-xs font-semibold">
            <span className="bg-flame size-1.5 animate-pulse rounded-full" />
            {match.clockMin}&apos; LIVE
          </span>
        ) : (
          <span className="text-muted-foreground font-mono text-xs">FT</span>
        )}
      </div>

      <div className="font-display flex items-center justify-center gap-3 text-lg font-bold">
        <span className="flex items-center gap-2">
          <span className="text-2xl">{match.home.flag}</span>
          {match.home.code}
        </span>
        <span className="text-foreground min-w-14 text-center font-mono text-xl">
          {match.score[0]}&nbsp;-&nbsp;{match.score[1]}
        </span>
        <span className="flex items-center gap-2">
          {match.away.code}
          <span className="text-2xl">{match.away.flag}</span>
        </span>
      </div>

      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span className="flex shrink-0 items-center gap-1.5">
          <Clock className="size-3.5" /> {formatKickoff(match.playedAt)}
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{match.venue}</span>
        </span>
      </div>
    </>
  );

  const shell = isLive ? 'border-flame/40 bg-card hover:border-flame/70' : 'border-border bg-card';

  if (!onOpen) {
    return (
      <div className={`w-full space-y-3 rounded-2xl border px-4 py-4 ${shell}`}>{content}</div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full space-y-3 rounded-2xl border px-4 py-4 text-left transition-colors ${shell}`}
    >
      {content}
    </button>
  );
}

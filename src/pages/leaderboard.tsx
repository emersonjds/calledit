import { Link } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { DataNote } from '@/shared/ui/data-note';
import { cn } from '@/shared/lib/utils';
import { useLeaderboard } from '@/features/profile';

export function LeaderboardPage() {
  const leaderboard = useLeaderboard();
  const entries = leaderboard.data?.entries ?? [];

  return (
    <div className="space-y-3 px-4 py-4">
      <DataNote>Leaderboard is placeholder backend data in live mode.</DataNote>
      <div className="flex items-center gap-2">
        <Link to="/profile" className="text-muted-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-display text-xl font-bold">Global Leaderboard</h1>
      </div>
      <p className="text-muted-foreground text-xs">
        Ranked by provable accuracy — every call verified on-chain, impossible to fake.
      </p>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={`${entry.rank}-${entry.handle}`}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-2.5',
              entry.you ? 'border-lime bg-lime/10 glow-lime' : 'border-border bg-card',
            )}
          >
            <span className="font-display text-muted-foreground w-7 text-lg font-bold">
              {entry.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm font-semibold', entry.you && 'text-lime')}>
                {entry.handle} {entry.you && '(you)'}
              </p>
              <p className="text-muted-foreground text-xs">{entry.calls} calls</p>
            </div>
            <div className="text-flame flex items-center gap-1">
              <Flame className="size-3.5" />
              <span className="text-xs font-semibold">{entry.streak}</span>
            </div>
            <span className="font-display text-lime w-12 text-right text-lg font-bold">
              {entry.accuracy}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

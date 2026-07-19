import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataNote } from '@/shared/ui/data-note';
import { toast } from 'sonner';
import { Wallet, Zap } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  EventTicker,
  MatchHeader,
  PctMeter,
  PredictionBoard,
  StakeSelector,
  StreakBanner,
} from '@/widgets';
import { formatSol } from '@/shared/lib/format';
import { useMatchFeed } from '@/features/feed';
import { useMakePrediction } from '@/features/prediction';
import { useProfile } from '@/features/profile';
import { useSession } from '@/store/session';
import { PredictionOverlay } from './prediction-overlay';

export function LiveMatchPage() {
  const feed = useMatchFeed();
  const profile = useProfile();
  const makePrediction = useMakePrediction();
  const selectedMarket = useSession((state) => state.selectedMarket);
  const selectMarket = useSession((state) => state.selectMarket);
  const activePredictionId = useSession((state) => state.activePredictionId);

  const [stake, setStake] = useState(1);
  const balance = profile.data?.balanceSol ?? 0;
  const streak = profile.data?.currentStreak ?? 0;

  const canCall =
    selectedMarket !== null &&
    stake > 0 &&
    stake <= balance &&
    !makePrediction.isPending &&
    feed.data?.live === true;

  const call = () => {
    if (!selectedMarket) return;
    makePrediction.mutate(
      { market: selectedMarket, stakeSol: stake },
      { onError: (error) => toast.error((error as Error).message) },
    );
  };

  return (
    <div className="space-y-3 px-4 py-3">
      <DataNote>
        Live feed shows placeholder teams until the TxLINE ingester maps the fixture.
      </DataNote>
      <div className="flex items-center justify-between">
        <span className="font-display text-lime text-lg font-extrabold tracking-tight">
          CALLED IT
        </span>
        <Link
          to="/wallet"
          className="border-border bg-card text-foreground hover:border-lime flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs transition-colors"
        >
          <Wallet className="text-lime size-3.5" />
          {formatSol(balance)}
        </Link>
      </div>

      {feed.isLoading || !feed.data ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <MatchHeader
            home={feed.data.home}
            away={feed.data.away}
            score={feed.data.score}
            clockMin={feed.data.clockMin}
            period={feed.data.period}
            live={feed.data.live}
          />
          <EventTicker events={feed.data.events} />
          <PctMeter pct={feed.data.pct} home={feed.data.home} away={feed.data.away} />
          <StreakBanner streak={streak} />
          <PredictionBoard
            markets={feed.data.markets}
            selected={selectedMarket}
            onSelect={selectMarket}
          />
          <StakeSelector value={stake} balanceSol={balance} onChange={setStake} />
          <Button
            size="lg"
            disabled={!canCall}
            onClick={call}
            className="bg-lime text-background hover:bg-lime/90 h-14 w-full text-base font-bold disabled:opacity-40"
          >
            {makePrediction.isPending ? 'Stamping on-chain…' : 'CALL IT'}
            <Zap className="size-5" />
          </Button>
        </>
      )}

      {activePredictionId && <PredictionOverlay id={activePredictionId} />}
    </div>
  );
}

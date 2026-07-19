import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { MARKETS } from '@/entities/prediction';
import { formatSol, shortAddress } from '@/shared/lib/format';
import { liveMatchMinute } from '@/shared/lib/match-clock';
import { TREASURY_ADDRESS, isDemo } from '@/shared/config';
import { useLiveKickoff, useMatchFeed } from '@/features/feed';
import { useMakePrediction } from '@/features/prediction';
import { useProfile } from '@/features/profile';
import { useSession } from '@/store/session';
import { PredictionOverlay } from './prediction-overlay';

export function LiveMatchPage() {
  const feed = useMatchFeed();
  const kickoff = useLiveKickoff();
  const profile = useProfile();
  const makePrediction = useMakePrediction();
  const selectedMarket = useSession((state) => state.selectedMarket);
  const selectMarket = useSession((state) => state.selectMarket);
  const activePredictionId = useSession((state) => state.activePredictionId);

  const [stake, setStake] = useState(1);
  const balance = profile.data?.balanceSol ?? 0;
  const streak = profile.data?.currentStreak ?? 0;

  // LIVE mode has no feed clock — derive the minute from kickoff + wall-clock (re-read
  // every 1s feed refetch). Demo keeps the compressed clock from the mock engine.
  const clockMin =
    !isDemo() && kickoff !== null ? liveMatchMinute(kickoff) : (feed.data?.clockMin ?? 0);

  const canCall =
    selectedMarket !== null &&
    stake > 0 &&
    stake <= balance &&
    !makePrediction.isPending &&
    feed.data?.live === true;

  const call = () => {
    if (!selectedMarket) return;
    // Honest pre-sign summary: Phantom is about to send a REAL devnet transfer.
    const ok = window.confirm(
      `Sign a real devnet stake?\n\n` +
        `Market: Next ${MARKETS[selectedMarket].label}\n` +
        `Stake: ${formatSol(stake)}\n` +
        `To treasury: ${shortAddress(TREASURY_ADDRESS)}`,
    );
    if (!ok) return;
    makePrediction.mutate(
      { market: selectedMarket, stakeSol: stake },
      { onError: (error) => toast.error((error as Error).message) },
    );
  };

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="text-muted-foreground mx-auto flex items-center justify-center gap-1.5 text-[10px]">
        <span className="bg-lime size-1.5 animate-pulse rounded-full" />
        Live odds &amp; stats powered by{' '}
        <span className="text-foreground font-semibold">TxLINE</span>
      </div>
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
            clockMin={clockMin}
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
          {!feed.data.live && (
            <p className="text-muted-foreground text-center text-xs">
              This match isn’t live — calls open once play starts.
            </p>
          )}
        </>
      )}

      {activePredictionId && <PredictionOverlay id={activePredictionId} />}
    </div>
  );
}

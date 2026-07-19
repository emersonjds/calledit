import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Wallet, Zap } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  EventTicker,
  Logo,
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
import { useOnchainBalance } from '@/features/wallet';
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
  const address = useSession((state) => state.address);
  const chain = useSession((state) => state.chain);

  const [stake, setStake] = useState(0.05);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Live mode shows the wallet's real on-chain devnet balance; demo uses the mock ledger.
  const onchainBalance = useOnchainBalance(address, !isDemo() && chain === 'solana');
  const balance =
    !isDemo() && onchainBalance.data !== undefined
      ? onchainBalance.data
      : (profile.data?.balanceSol ?? 0);
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

  const ackKey = address ? `called-it:stake-ack:${address}` : null;

  const submit = () => {
    if (!selectedMarket) return;
    makePrediction.mutate(
      { market: selectedMarket, stakeSol: stake },
      { onError: (error) => toast.error((error as Error).message) },
    );
  };

  const call = () => {
    if (!selectedMarket) return;
    // First call for a wallet asks for confirmation; after that it signs straight away.
    if (ackKey && localStorage.getItem(ackKey) === '1') {
      toast('Confirmation set for this wallet — signing…', { duration: 1500 });
      submit();
      return;
    }
    setConfirmOpen(true);
  };

  const confirmAndSubmit = () => {
    if (ackKey) localStorage.setItem(ackKey, '1');
    setConfirmOpen(false);
    submit();
  };

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="text-muted-foreground mx-auto flex items-center justify-center gap-1.5 text-[10px]">
        <span className="bg-lime size-1.5 animate-pulse rounded-full" />
        Live odds &amp; stats powered by{' '}
        <span className="text-foreground font-semibold">TxLINE</span>
      </div>
      <div className="flex items-center justify-between">
        <Logo compact />
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

      {selectedMarket && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="border-lime/25 bg-card max-w-sm rounded-3xl">
            <DialogHeader className="items-center text-center">
              <span className="border-lime/30 bg-lime/10 mb-1 flex size-12 items-center justify-center rounded-2xl border">
                <Zap className="text-lime size-6" fill="currentColor" />
              </span>
              <DialogTitle className="font-display text-xl font-bold tracking-tight">
                {isDemo() ? 'Place your call' : 'Confirm your call'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                {isDemo()
                  ? 'Simulated call — no real funds move.'
                  : 'Phantom will sign a real devnet stake to the treasury.'}
              </DialogDescription>
            </DialogHeader>

            <div className="border-border bg-background/40 space-y-2.5 rounded-2xl border p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Market</span>
                <span className="font-semibold">Next {MARKETS[selectedMarket].label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Stake</span>
                <span className="text-lime font-mono font-semibold">{formatSol(stake)}</span>
              </div>
              {!isDemo() && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">To treasury</span>
                  <span className="font-mono text-xs">{shortAddress(TREASURY_ADDRESS)}</span>
                </div>
              )}
            </div>

            <p className="text-muted-foreground text-center text-xs">
              We’ll only ask once — after this, this wallet signs instantly.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmAndSubmit}
                className="bg-lime text-background hover:bg-lime/90 flex-1 font-bold"
              >
                {isDemo() ? 'Call it' : 'Sign & call it'}
                <Zap className="size-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

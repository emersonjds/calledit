import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, ExternalLink, Share2, X } from 'lucide-react';
import { MARKETS } from '@/entities/prediction';
import { Button } from '@/shared/ui/button';
import { CountdownRing, Logo, OnchainSeal } from '@/widgets';
import { formatClock, formatSol, shortHash } from '@/shared/lib/format';
import { explorerTxUrl } from '@/shared/lib/solana-explorer';
import { isDemo } from '@/shared/config';
import { MATCH_MIN_PER_SEC } from '@/mocks/config';
import { usePredictionStatus } from '@/features/prediction';
import { useSession } from '@/store/session';

export function PredictionOverlay({ id }: { id: string }) {
  const { data: prediction } = usePredictionStatus(id);
  const setActive = useSession((state) => state.setActivePrediction);
  const selectMarket = useSession((state) => state.selectMarket);

  const close = () => {
    setActive(null);
    selectMarket(null);
  };

  // LIVE settles in real wall-clock: windowMin is 5 REAL minutes. Demo compresses
  // match-minutes into seconds via the mock engine's MATCH_MIN_PER_SEC.
  const total = prediction
    ? isDemo()
      ? Math.max(3, Math.round(prediction.windowMin / MATCH_MIN_PER_SEC))
      : prediction.windowMin * 60
    : 10;
  const [secondsLeft, setSecondsLeft] = useState(total);

  useEffect(() => {
    if (!prediction || prediction.status !== 'resolving') return;
    const tick = () => {
      const elapsed = (Date.now() - prediction.stamp.stampedAt) / 1000;
      setSecondsLeft(Math.max(0, total - elapsed));
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [prediction, total]);

  if (!prediction) return null;

  const marketLabel = MARKETS[prediction.market].label;
  const won = prediction.status === 'won';
  const settlement = prediction.settlement;

  return (
    <div className="bg-background/98 fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] flex-col items-center justify-center gap-6 px-6 py-10 backdrop-blur">
      {prediction.status === 'resolving' && (
        <>
          <OnchainSeal verified stampedAt={prediction.stamp.stampedAt} size={128} />
          <div className="space-y-1 text-center">
            <p className="text-lime text-xs font-semibold tracking-widest">STAKE ON-CHAIN</p>
            <h2 className="font-display text-2xl font-bold">Prediction Committed</h2>
            <div className="text-muted-foreground flex items-center justify-center gap-1.5 font-mono text-xs">
              <ExplorerLink sig={prediction.stamp.txHash} label="stake tx" />
              <span>· seq {prediction.stamp.seq}</span>
              {prediction.atClockMin > 0 && (
                <span>· called {formatClock(prediction.atClockMin)}</span>
              )}
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            <Stat label="Predicted" value={`Next ${marketLabel}`} />
            <Stat label="Stake" value={formatSol(prediction.stakeSol)} />
            <Stat label="Multiplier" value={`${prediction.multiplier}x`} />
            <Stat label="Potential" value={formatSol(prediction.potentialSol)} accent />
          </div>
          <CountdownRing seconds={Math.ceil(secondsLeft)} total={total} label="RESOLVING..." />
          <Button variant="ghost" className="text-muted-foreground" onClick={close}>
            <X className="size-4" /> Minimize
          </Button>
        </>
      )}

      {won && settlement && (
        <>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="border-lime/30 bg-lime/10 glow-lime inline-flex items-center gap-1.5 rounded-2xl border px-6 py-3">
              <Logo className="gap-1.5 text-4xl" />
              <span className="font-display text-lime text-4xl font-black" aria-hidden="true">
                !
              </span>
            </span>
            <span className="bg-lime text-background inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-bold tracking-[0.15em]">
              <Check className="size-3" strokeWidth={3.5} />
              WON · PAID
            </span>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-xs tracking-widest">TOTAL PAYOUT</p>
            <p className="font-display text-lime text-5xl font-extrabold">
              {formatSol(settlement.payoutSol)}
            </p>
          </div>
          <OnchainSeal verified size={112} />
          <div className="space-y-1 text-center text-sm">
            <p className="text-flame font-semibold">🔥 Won at {prediction.multiplier}x</p>
            <p className="text-muted-foreground">
              You called it{' '}
              <span className="text-foreground font-semibold">
                {settlement.calledSecondsBefore}s
              </span>{' '}
              before it happened.
            </p>
            <p className="text-muted-foreground font-mono text-xs">
              proof {shortHash(settlement.proofId)}
            </p>
            {settlement.payoutTxHash && (
              <p>
                <ExplorerLink sig={settlement.payoutTxHash} label="payout tx" />
              </p>
            )}
            {settlement.verifiedOnChain && (
              <p className="text-lime/90 text-[11px] font-semibold tracking-wide">
                validated on-chain (validate_stat)
              </p>
            )}
          </div>
          <div className="w-full space-y-2">
            <Button
              className="bg-lime text-background hover:bg-lime/90 h-12 w-full font-bold"
              onClick={close}
            >
              Next prediction →
            </Button>
            <Button
              variant="outline"
              className="border-border w-full"
              onClick={() => toast.success('Proof link copied to clipboard')}
            >
              <Share2 className="size-4" /> Share proof
            </Button>
          </div>
        </>
      )}

      {prediction.status === 'lost' && (
        <>
          <div className="border-border flex size-28 items-center justify-center rounded-full border-2">
            <X className="text-muted-foreground size-14" />
          </div>
          <div className="space-y-1 text-center">
            <h2 className="font-display text-muted-foreground text-3xl font-bold">Not this time</h2>
            <p className="text-muted-foreground text-sm">
              No {marketLabel.toLowerCase()} in the window. Streak reset — read the game and go
              again.
            </p>
          </div>
          <Button
            className="bg-lime text-background hover:bg-lime/90 h-12 w-full font-bold"
            onClick={close}
          >
            Try again
          </Button>
        </>
      )}
    </div>
  );
}

function ExplorerLink({ sig, label }: { sig: string; label: string }) {
  return (
    <a
      href={explorerTxUrl(sig)}
      target="_blank"
      rel="noreferrer"
      className="text-lime inline-flex items-center gap-1 font-mono underline underline-offset-2 hover:opacity-80"
    >
      {label} {shortHash(sig)}
      <ExternalLink className="size-3" />
    </a>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-border bg-card rounded-xl border px-3 py-2">
      <p className="text-muted-foreground text-[10px] tracking-widest">{label.toUpperCase()}</p>
      <p className={`font-display text-lg font-bold ${accent ? 'text-lime' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}

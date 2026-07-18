import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Share2, X } from "lucide-react";
import { MARKETS } from "@/entities/prediction";
import { Button } from "@/shared/ui/button";
import { CountdownRing, OnchainSeal } from "@/widgets";
import { formatSol, shortHash } from "@/shared/lib/format";
import { MATCH_MIN_PER_SEC } from "@/mocks/config";
import { usePredictionStatus } from "@/features/prediction";
import { useSession } from "@/store/session";

export function PredictionOverlay({ id }: { id: string }) {
  const { data: prediction } = usePredictionStatus(id);
  const setActive = useSession((state) => state.setActivePrediction);
  const selectMarket = useSession((state) => state.selectMarket);

  const close = () => {
    setActive(null);
    selectMarket(null);
  };

  const total = prediction ? Math.max(3, Math.round(prediction.windowMin / MATCH_MIN_PER_SEC)) : 10;
  const [secondsLeft, setSecondsLeft] = useState(total);

  useEffect(() => {
    if (!prediction || prediction.status !== "resolving") return;
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
  const won = prediction.status === "won";
  const settlement = prediction.settlement;

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] flex-col items-center justify-center gap-6 bg-background/98 px-6 py-10 backdrop-blur">
      {prediction.status === "resolving" && (
        <>
          <OnchainSeal verified stampedAt={prediction.stamp.stampedAt} size={128} />
          <div className="space-y-1 text-center">
            <p className="text-xs font-semibold tracking-widest text-lime">
              STAMPED ON-CHAIN · VERIFIED
            </p>
            <h2 className="font-display text-2xl font-bold">Prediction Committed</h2>
            <p className="font-mono text-xs text-muted-foreground">
              tx {shortHash(prediction.stamp.txHash)} · seq {prediction.stamp.seq}
            </p>
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
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-4xl font-extrabold text-lime">CALLED IT!</h2>
              <Check className="size-9 text-lime" strokeWidth={3} />
            </div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground">
              PREDICTION VERIFIED
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs tracking-widest text-muted-foreground">TOTAL PAYOUT</p>
            <p className="font-display text-5xl font-extrabold text-lime">
              {formatSol(settlement.payoutSol)}
            </p>
          </div>
          <OnchainSeal verified size={112} />
          <div className="space-y-1 text-center text-sm">
            <p className="font-semibold text-flame">🔥 Won at {prediction.multiplier}x</p>
            <p className="text-muted-foreground">
              You called it{" "}
              <span className="font-semibold text-foreground">
                {settlement.calledSecondsBefore}s
              </span>{" "}
              before it happened.
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              proof {shortHash(settlement.proofId)}
            </p>
          </div>
          <div className="w-full space-y-2">
            <Button
              className="h-12 w-full bg-lime font-bold text-background hover:bg-lime/90"
              onClick={close}
            >
              Next prediction →
            </Button>
            <Button
              variant="outline"
              className="w-full border-border"
              onClick={() => toast.success("Proof link copied to clipboard")}
            >
              <Share2 className="size-4" /> Share proof
            </Button>
          </div>
        </>
      )}

      {prediction.status === "lost" && (
        <>
          <div className="flex size-28 items-center justify-center rounded-full border-2 border-border">
            <X className="size-14 text-muted-foreground" />
          </div>
          <div className="space-y-1 text-center">
            <h2 className="font-display text-3xl font-bold text-muted-foreground">
              Not this time
            </h2>
            <p className="text-sm text-muted-foreground">
              No {marketLabel.toLowerCase()} in the window. Streak reset — read the game
              and go again.
            </p>
          </div>
          <Button
            className="h-12 w-full bg-lime font-bold text-background hover:bg-lime/90"
            onClick={close}
          >
            Try again
          </Button>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2">
      <p className="text-[10px] tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <p className={`font-display text-lg font-bold ${accent ? "text-lime" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

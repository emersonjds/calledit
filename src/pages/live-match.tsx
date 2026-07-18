import { useState } from "react";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  EventTicker,
  MatchHeader,
  PctMeter,
  PredictionBoard,
  StakeSelector,
  StreakBanner,
} from "@/widgets";
import { formatSol } from "@/shared/lib/format";
import { useMatchFeed } from "@/features/feed";
import { useMakePrediction } from "@/features/prediction";
import { useProfile } from "@/features/profile";
import { useSession } from "@/store/session";
import { PredictionOverlay } from "./prediction-overlay";

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
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-extrabold tracking-tight text-lime">
          CALLED IT
        </span>
        <span className="rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-foreground">
          {formatSol(balance)}
        </span>
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
            className="h-14 w-full bg-lime text-base font-bold text-background hover:bg-lime/90 disabled:opacity-40"
          >
            {makePrediction.isPending ? "Stamping on-chain…" : "CALL IT"}
            <Zap className="size-5" />
          </Button>
        </>
      )}

      {activePredictionId && <PredictionOverlay id={activePredictionId} />}
    </div>
  );
}

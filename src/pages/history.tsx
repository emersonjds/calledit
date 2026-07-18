import { ExternalLink } from "lucide-react";
import { MARKETS, type Prediction } from "@/entities/prediction";
import { Badge } from "@/shared/ui/badge";
import { formatSol, formatTimeOfDay, shortHash } from "@/shared/lib/format";
import { useHistory } from "@/features/profile";

export function CallRow({ prediction }: { prediction: Prediction }) {
  const market = MARKETS[prediction.market];
  const settled = prediction.status !== "resolving";
  const won = prediction.status === "won";

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          Next {market.label} · {formatSol(prediction.stakeSol)}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {formatTimeOfDay(prediction.stamp.stampedAt)} · {shortHash(prediction.stamp.txHash)}
          {market.provable && " · on-chain"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {settled ? (
          <span
            className={`font-display text-sm font-bold ${won ? "text-lime" : "text-muted-foreground"}`}
          >
            {won ? `+${formatSol(prediction.settlement?.payoutSol ?? 0)}` : "Lost"}
          </span>
        ) : (
          <Badge variant="outline" className="border-flame/50 text-flame">
            live
          </Badge>
        )}
        {market.provable && <ExternalLink className="size-3.5 text-muted-foreground" />}
      </div>
    </div>
  );
}

export function HistoryPage() {
  const history = useHistory();
  const items = history.data ?? [];

  return (
    <div className="space-y-3 px-4 py-4">
      <h1 className="font-display text-xl font-bold">Call History</h1>
      {items.length === 0 ? (
        <p className="pt-10 text-center text-sm text-muted-foreground">
          No calls yet. Head to the match and call your first one.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((prediction) => (
            <CallRow key={prediction.id} prediction={prediction} />
          ))}
        </div>
      )}
    </div>
  );
}

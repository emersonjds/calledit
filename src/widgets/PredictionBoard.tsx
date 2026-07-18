import { Flag, Footprints, Goal, Square, type LucideIcon } from "lucide-react";
import type { MarketQuote } from "@/entities/match";
import { MARKET_LIST, type MarketId } from "@/entities/prediction";
import { formatMultiplier } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

interface PredictionBoardProps {
  markets: MarketQuote[];
  selected: MarketId | null;
  onSelect: (market: MarketId) => void;
}

const MARKET_ICON: Record<MarketId, LucideIcon> = {
  corner: Flag,
  card: Square,
  goal: Goal,
  foul: Footprints,
};

export function PredictionBoard({ markets, selected, onSelect }: PredictionBoardProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {MARKET_LIST.map((market) => {
        const Icon = MARKET_ICON[market.id];
        const quote = markets.find((entry) => entry.market === market.id);
        const multiplier = formatMultiplier(quote?.multiplier ?? market.baseMultiplier);
        const isSelected = selected === market.id;

        return (
          <button
            key={market.id}
            type="button"
            onClick={() => onSelect(market.id)}
            aria-pressed={isSelected}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-colors",
              isSelected ? "border-lime glow-lime" : "border-border hover:border-border/80",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <Icon className={cn("size-5", isSelected ? "text-lime" : "text-foreground")} />
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  market.provable ? "bg-lime/15 text-lime" : "bg-muted text-muted-foreground",
                )}
              >
                {market.provable ? "on-chain" : "for fun"}
              </span>
            </div>
            <span className="font-display text-sm font-bold text-foreground">{market.label}</span>
            <span className="font-mono text-lg font-bold text-foreground">{multiplier}</span>
          </button>
        );
      })}
    </div>
  );
}

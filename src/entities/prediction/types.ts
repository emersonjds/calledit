import type { MatchEvent } from "@/entities/match";
import type { MarketId } from "./markets";

export type PredictionStatus = "resolving" | "won" | "lost";

/** On-chain commitment proving *when* the call was made. */
export interface OnChainStamp {
  txHash: string;
  stampedAt: number; // ms epoch — the proof `ts`
  seq: number; // starts at 1 (seq=0 is rejected on-chain)
  epochDay: number; // derived from `stampedAt`, never Date.now()
}

/** Result of running the settlement predicate against the TxLINE Merkle result. */
export interface Settlement {
  proofId: string;
  payoutSol: number;
  calledSecondsBefore: number;
  resolvedEvent: MatchEvent | null;
}

export interface Prediction {
  id: string;
  matchId: string;
  market: MarketId;
  provable: boolean;
  stakeSol: number;
  multiplier: number; // locked at commit (market × streak bonus)
  potentialSol: number;
  atClockMin: number; // match-minute at commit
  windowMin: number; // wins if the event occurs within this many match-minutes
  status: PredictionStatus;
  stamp: OnChainStamp;
  settlement?: Settlement;
}

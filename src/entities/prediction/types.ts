import type { MatchEvent } from '@/entities/match';
import type { MarketId } from './markets';

export type PredictionStatus = 'resolving' | 'won' | 'lost';

export interface OnChainStamp {
  txHash: string;
  stampedAt: number;
  seq: number; // starts at 1 (seq=0 is rejected on-chain)
  epochDay: number; // derived from `stampedAt`, never Date.now()
}

export interface Settlement {
  proofId: string;
  payoutSol: number;
  calledSecondsBefore: number;
  resolvedEvent: MatchEvent | null;
  payoutTxHash?: string;
  verifiedOnChain?: boolean;
}

export interface Prediction {
  id: string;
  matchId: string;
  market: MarketId;
  provable: boolean;
  stakeSol: number;
  multiplier: number;
  potentialSol: number;
  atClockMin: number;
  windowMin: number;
  status: PredictionStatus;
  stamp: OnChainStamp;
  settlement?: Settlement;
}

import type { MatchEventType } from '@/entities/match';

export type MarketId = 'corner' | 'card' | 'goal' | 'foul';

export interface MarketDef {
  id: MarketId;
  label: string;
  /** Event type in the rich feed that resolves this market. */
  eventType: MatchEventType;
  /** True only if backed by the 8 provable TxLINE keys (settles on-chain). */
  provable: boolean;
  /** Provable stat base keys per team (empty when not provable). */
  keys: number[];
  /** Base payout multiplier before the streak bonus. */
  baseMultiplier: number;
}

/**
 * Provability is the hard constraint: goals/cards/corners settle on-chain (TxLINE keys);
 * `foul` is not in the Merkle tree — it stays a for-fun market, never routed to settlement.
 */
export const MARKETS: Record<MarketId, MarketDef> = {
  corner: {
    id: 'corner',
    label: 'Corner',
    eventType: 'corner',
    provable: true,
    keys: [7, 8],
    baseMultiplier: 2.4,
  },
  card: {
    id: 'card',
    label: 'Card',
    eventType: 'yellow',
    provable: true,
    keys: [3, 4, 5, 6],
    baseMultiplier: 3.1,
  },
  goal: {
    id: 'goal',
    label: 'Goal',
    eventType: 'goal',
    provable: true,
    keys: [1, 2],
    baseMultiplier: 8.5,
  },
  foul: {
    id: 'foul',
    label: 'Foul',
    eventType: 'foul',
    provable: false,
    keys: [],
    baseMultiplier: 1.8,
  },
};

export const MARKET_LIST: MarketDef[] = [MARKETS.corner, MARKETS.card, MARKETS.goal, MARKETS.foul];

export function isMarketId(value: string): value is MarketId {
  return value in MARKETS;
}

export type Period = '1H' | 'HT' | '2H' | 'ET' | 'PENS' | 'FT';

export type MatchEventType = 'goal' | 'yellow' | 'red' | 'corner' | 'foul' | 'sub' | 'var';

export type TeamSide = 'home' | 'away';

export interface TeamInfo {
  code: string; // e.g. "BRA"
  name: string; // e.g. "Brazil"
  flag: string; // emoji flag
}

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  side: TeamSide;
  clockMin: number;
  player?: string;
  detail?: string;
}

/** Clean win probabilities from the feed's `Pct` (house margin already removed). Sum ≈ 1. */
export interface WinProbability {
  home: number;
  draw: number;
  away: number;
}

export interface MarketQuote {
  market: string; // MarketId, kept loose here to avoid a cross-entity cycle
  multiplier: number;
}

export interface MatchSnapshot {
  matchId: string;
  clockMin: number;
  period: Period;
  home: TeamInfo;
  away: TeamInfo;
  score: [number, number];
  pct: WinProbability;
  events: MatchEvent[]; // chronological, up to the current clock
  markets: MarketQuote[]; // live multipliers per market
  live: boolean;
}

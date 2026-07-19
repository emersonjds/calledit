export type Period = '1H' | 'HT' | '2H' | 'ET' | 'PENS' | 'FT';

export type MatchEventType = 'goal' | 'yellow' | 'red' | 'corner' | 'foul' | 'sub' | 'var';

export type TeamSide = 'home' | 'away';

export interface TeamInfo {
  code: string;
  name: string;
  flag: string;
}

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  side: TeamSide;
  clockMin: number;
  player?: string;
  detail?: string;
}

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
  events: MatchEvent[];
  markets: MarketQuote[];
  live: boolean;
}

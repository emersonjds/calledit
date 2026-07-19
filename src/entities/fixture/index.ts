import type { TeamInfo } from '@/entities/match';

export type MatchStatus = 'live' | 'finished';

export interface MatchCard {
  id: string;
  home: TeamInfo;
  away: TeamInfo;
  score: [number, number];
  status: MatchStatus;
  clockMin: number; // live: current minute; finished: minute at full time
  playedAt: number; // ms epoch — kickoff (live) or full time (finished)
  stage: string; // e.g. "Semi-final"
  venue: string;
}

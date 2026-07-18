import type { TeamInfo } from "@/entities/match";

export interface Fixture {
  id: string;
  home: TeamInfo;
  away: TeamInfo;
  kickoff: number; // ms epoch
  stage: string; // e.g. "Semi-final"
  venue: string;
}

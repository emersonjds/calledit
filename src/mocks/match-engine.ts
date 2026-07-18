import type {
  MarketQuote,
  MatchEvent,
  MatchEventType,
  MatchSnapshot,
  Period,
  TeamSide,
  WinProbability,
} from "@/entities/match";
import { MARKET_LIST } from "@/entities/prediction";
import {
  AWAY_TEAM,
  DEMO_MATCH_ID,
  HOME_TEAM,
  MATCH_FULL_MIN,
  MATCH_MIN_PER_SEC,
} from "./config";
import { mulberry32 } from "./prng";

const HOME_PLAYERS = ["Vinícius Jr", "Rodrygo", "Raphinha", "Bruno G.", "Casemiro"];
const AWAY_PLAYERS = ["Mbappé", "Griezmann", "Dembélé", "Tchouaméni", "Saliba"];

interface ScheduledEvent extends MatchEvent {
  clockMin: number;
}

/** Poisson-ish placement of a stat across the match, seeded for reproducibility. */
function place(
  rng: () => number,
  type: MatchEventType,
  count: number,
  minMinute: number,
): ScheduledEvent[] {
  const out: ScheduledEvent[] = [];
  for (let i = 0; i < count; i++) {
    const clockMin = Math.floor(minMinute + rng() * (MATCH_FULL_MIN - minMinute));
    const side: TeamSide = rng() > 0.5 ? "home" : "away";
    const players = side === "home" ? HOME_PLAYERS : AWAY_PLAYERS;
    out.push({
      id: `${type}-${i}-${clockMin}`,
      type,
      side,
      clockMin,
      player: players[Math.floor(rng() * players.length)],
    });
  }
  return out;
}

/** Full deterministic event timeline for a match seed. */
export function buildSchedule(seed: number): ScheduledEvent[] {
  const rng = mulberry32(seed);
  const events = [
    ...place(rng, "goal", 2 + Math.floor(rng() * 3), 4),
    ...place(rng, "yellow", 3 + Math.floor(rng() * 3), 8),
    ...place(rng, "red", rng() > 0.75 ? 1 : 0, 55),
    ...place(rng, "corner", 8 + Math.floor(rng() * 5), 3),
    ...place(rng, "foul", 14 + Math.floor(rng() * 8), 2),
  ];
  return events.sort((a, b) => a.clockMin - b.clockMin);
}

function periodFor(clockMin: number): Period {
  if (clockMin < 45) return "1H";
  if (clockMin < 46) return "HT";
  if (clockMin <= 90) return "2H";
  if (clockMin < MATCH_FULL_MIN) return "ET";
  return "FT";
}

function scoreAt(events: ScheduledEvent[], clockMin: number): [number, number] {
  let home = 0;
  let away = 0;
  for (const event of events) {
    if (event.type === "goal" && event.clockMin <= clockMin) {
      if (event.side === "home") home++;
      else away++;
    }
  }
  return [home, away];
}

/** Clean win probability derived from score margin and time remaining (sums to 1). */
function winProbability(score: [number, number], clockMin: number): WinProbability {
  const margin = score[0] - score[1];
  const settled = Math.min(1, clockMin / 95); // late margins matter more
  const homeEdge = margin * (0.12 + settled * 0.22);
  let home = 0.4 + homeEdge;
  let away = 0.4 - homeEdge;
  const draw = Math.max(0.08, 0.2 - settled * 0.12 - Math.abs(margin) * 0.05);
  home = Math.max(0.02, home);
  away = Math.max(0.02, away);
  const total = home + draw + away;
  return { home: home / total, draw: draw / total, away: away / total };
}

function liveMultipliers(clockMin: number): MarketQuote[] {
  // Slight, deterministic drift around each market's base so odds feel alive.
  const drift = Math.sin(clockMin / 7) * 0.3;
  return MARKET_LIST.map((market) => ({
    market: market.id,
    multiplier: Math.round((market.baseMultiplier + drift) * 10) / 10,
  }));
}

export function clockFromElapsed(elapsedSec: number): number {
  return elapsedSec * MATCH_MIN_PER_SEC;
}

export interface EngineInput {
  seed: number;
  elapsedSec: number;
}

export function snapshotAt({ seed, elapsedSec }: EngineInput): MatchSnapshot {
  const schedule = buildSchedule(seed);
  const clockMin = Math.min(MATCH_FULL_MIN, clockFromElapsed(elapsedSec));
  const period = periodFor(clockMin);
  const score = scoreAt(schedule, clockMin);
  const events = schedule
    .filter((event) => event.clockMin <= clockMin)
    .slice(-12)
    .reverse();

  return {
    matchId: DEMO_MATCH_ID,
    clockMin: Math.floor(clockMin),
    period,
    home: { ...HOME_TEAM },
    away: { ...AWAY_TEAM },
    score,
    pct: winProbability(score, clockMin),
    events,
    markets: liveMultipliers(clockMin),
    live: period !== "FT",
  };
}

/** Does an event of `type` occur strictly after `fromMin` and within `windowMin`? */
export function findResolvingEvent(
  seed: number,
  type: MatchEventType,
  fromMin: number,
  windowMin: number,
): MatchEvent | null {
  const schedule = buildSchedule(seed);
  return (
    schedule.find(
      (event) =>
        event.type === type &&
        event.clockMin > fromMin &&
        event.clockMin <= fromMin + windowMin,
    ) ?? null
  );
}

import type {
  MarketQuote,
  MatchEvent,
  MatchEventType,
  MatchSnapshot,
  Period,
  TeamSide,
  WinProbability,
} from '@/entities/match';
import { MARKET_LIST } from '@/entities/prediction';
import { AWAY_TEAM, DEMO_MATCH_ID, HOME_TEAM, MATCH_FULL_MIN, MATCH_MIN_PER_SEC } from './config';

const HOME_PLAYERS = [
  'Harry Kane',
  'Jude Bellingham',
  'Bukayo Saka',
  'Phil Foden',
  'Marcus Rashford',
];
const AWAY_PLAYERS = [
  'Kylian Mbappé',
  'Antoine Griezmann',
  'Ousmane Dembélé',
  'Aurélien Tchouaméni',
  'Olivier Giroud',
];

interface ScheduledEvent extends MatchEvent {
  clockMin: number;
}

const GOALS: ReadonlyArray<[number, TeamSide, number]> = [
  [4, 'home', 0],
  [9, 'away', 0],
  [17, 'home', 1],
  [23, 'home', 2],
  [31, 'away', 1],
  [38, 'home', 3],
  [52, 'away', 2],
  [61, 'home', 0],
  [74, 'home', 4],
  [83, 'away', 4],
];

const YELLOWS: ReadonlyArray<[number, TeamSide, number]> = [
  [27, 'away', 3],
  [44, 'home', 1],
  [69, 'away', 3],
];

export function buildSchedule(): ScheduledEvent[] {
  const events: ScheduledEvent[] = [];
  const add = (type: MatchEventType, side: TeamSide, clockMin: number, playerIdx: number) => {
    const players = side === 'home' ? HOME_PLAYERS : AWAY_PLAYERS;
    events.push({
      id: `${type}-${side}-${clockMin}`,
      type,
      side,
      clockMin,
      player: players[playerIdx % players.length],
    });
  };

  for (const [clockMin, side, idx] of GOALS) add('goal', side, clockMin, idx);
  for (const [clockMin, side, idx] of YELLOWS) add('yellow', side, clockMin, idx);

  let index = 0;
  for (let clockMin = 3; clockMin <= 87; clockMin += 3) {
    add('corner', index % 2 === 0 ? 'home' : 'away', clockMin, index);
    index += 1;
  }
  for (let clockMin = 6; clockMin <= 84; clockMin += 6) {
    add('foul', (clockMin / 6) % 2 === 0 ? 'home' : 'away', clockMin, clockMin);
  }

  return events.sort((a, b) => a.clockMin - b.clockMin);
}

function periodFor(clockMin: number): Period {
  if (clockMin < 45) return '1H';
  if (clockMin < 46) return 'HT';
  if (clockMin <= 90) return '2H';
  if (clockMin < MATCH_FULL_MIN) return 'ET';
  return 'FT';
}

function scoreAt(events: ScheduledEvent[], clockMin: number): [number, number] {
  let home = 0;
  let away = 0;
  for (const event of events) {
    if (event.type === 'goal' && event.clockMin <= clockMin) {
      if (event.side === 'home') home++;
      else away++;
    }
  }
  return [home, away];
}

function winProbability(score: [number, number], clockMin: number): WinProbability {
  const margin = score[0] - score[1];
  const settled = Math.min(1, clockMin / 95);
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

export function snapshotAt({ elapsedSec }: EngineInput): MatchSnapshot {
  const schedule = buildSchedule();
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
    live: period !== 'FT',
  };
}

export function findResolvingEvent(
  type: MatchEventType,
  fromMin: number,
  windowMin: number,
): MatchEvent | null {
  const schedule = buildSchedule();
  return (
    schedule.find(
      (event) =>
        event.type === type && event.clockMin > fromMin && event.clockMin <= fromMin + windowMin,
    ) ?? null
  );
}

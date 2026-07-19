import type { MatchEvent, MatchEventType } from '@/entities/match';
import {
  MARKETS,
  accuracyPct,
  effectiveMultiplier,
  potentialPayout,
  type MarketId,
  type Prediction,
} from '@/entities/prediction';
import type { ProfileDto, LeaderboardDto } from '@/shared/api';
import { MATCH_MIN_PER_SEC, WINDOW_MIN } from './config';
import { findResolvingEvent } from './match-engine';
import {
  allLedgers,
  commitPersist,
  currentClockMin,
  getLedger,
  getMatch,
  getResolution,
  nextSeq,
  saveResolution,
} from './state';

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += BASE58[Math.floor(Math.random() * BASE58.length)];
  }
  return out;
}

/** Card resolves on yellow OR red; other markets on their single event type. */
function resolvingTypes(market: MarketId): MatchEventType[] {
  if (market === 'card') return ['yellow', 'red'];
  return [MARKETS[market].eventType];
}

function earliestEvent(
  types: MatchEventType[],
  fromMin: number,
  windowMin: number,
): MatchEvent | null {
  const found = types
    .map((type) => findResolvingEvent(type, fromMin, windowMin))
    .filter((event): event is MatchEvent => event !== null)
    .sort((a, b) => a.clockMin - b.clockMin);
  return found[0] ?? null;
}

export interface CommitInput {
  matchId: string;
  market: MarketId;
  stakeSol: number;
  address: string;
}

export type CommitResult = { ok: true; prediction: Prediction } | { ok: false; error: string };

export function commit({ matchId, market, stakeSol, address }: CommitInput): CommitResult {
  const ledger = getLedger(address);
  if (stakeSol <= 0) return { ok: false, error: 'Stake must be positive' };
  if (stakeSol > ledger.balanceSol) return { ok: false, error: 'Insufficient balance' };

  const def = MARKETS[market];
  const multiplier = effectiveMultiplier(def.baseMultiplier, ledger.streak);
  const potentialSol = potentialPayout(stakeSol, multiplier);
  const atClockMin = currentClockMin(); // server clock — never trust the client
  const windowMin = WINDOW_MIN[market] ?? 6;

  const stampedAt = Date.now();
  const prediction: Prediction = {
    id: `pred_${base58(10)}`,
    matchId,
    market,
    provable: def.provable,
    stakeSol,
    multiplier,
    potentialSol,
    atClockMin,
    windowMin,
    status: 'resolving',
    stamp: {
      txHash: base58(44),
      stampedAt,
      seq: nextSeq(),
      epochDay: Math.floor(stampedAt / 86_400_000), // derived from the proof ts
    },
  };

  ledger.balanceSol = Math.round((ledger.balanceSol - stakeSol) * 100) / 100;
  ledger.totalCalls += 1;
  ledger.predictions.unshift(prediction);
  ledger.activity.unshift({
    id: `act_${prediction.stamp.seq}`,
    type: 'stake',
    amountSol: stakeSol,
    method: `${def.label} call`,
    status: 'settled',
    ts: stampedAt,
  });

  saveResolution({
    id: prediction.id,
    address,
    seed: getMatch().seed,
    eventType: def.eventType,
    atClockMin,
    windowMin,
    resolveAtMs: stampedAt + (windowMin / MATCH_MIN_PER_SEC) * 1000,
  });
  commitPersist();
  return { ok: true, prediction };
}

export function getPrediction(id: string): Prediction | null {
  const record = getResolution(id);
  if (!record) return null;
  const ledger = getLedger(record.address);
  const prediction = ledger.predictions.find((entry) => entry.id === id);
  if (!prediction) return null;
  if (prediction.status !== 'resolving' || Date.now() < record.resolveAtMs) {
    return prediction;
  }

  const event = earliestEvent(
    resolvingTypes(prediction.market),
    record.atClockMin,
    record.windowMin,
  );
  const won = event !== null;

  if (won) {
    prediction.status = 'won';
    ledger.balanceSol = Math.round((ledger.balanceSol + prediction.potentialSol) * 100) / 100;
    ledger.streak += 1;
    ledger.bestStreak = Math.max(ledger.bestStreak, ledger.streak);
    ledger.wonCalls += 1;
    ledger.activity.unshift({
      id: `act_${base58(6)}`,
      type: 'payout',
      amountSol: prediction.potentialSol,
      method: 'settlement',
      status: 'settled',
      ts: Date.now(),
    });
  } else {
    prediction.status = 'lost';
    ledger.streak = 0;
  }

  prediction.settlement = {
    proofId: base58(44),
    payoutSol: won ? prediction.potentialSol : 0,
    calledSecondsBefore: won
      ? Math.max(1, Math.round((event.clockMin - record.atClockMin) / MATCH_MIN_PER_SEC))
      : 0,
    resolvedEvent: event,
  };
  commitPersist();
  return prediction;
}

export function profile(address: string): ProfileDto {
  const ledger = getLedger(address);
  return {
    address,
    handle: ledger.handle,
    accuracy: accuracyPct(ledger.wonCalls, ledger.totalCalls),
    totalCalls: ledger.totalCalls,
    wonCalls: ledger.wonCalls,
    bestStreak: ledger.bestStreak,
    currentStreak: ledger.streak,
    rank: rankOf(address),
    balanceSol: ledger.balanceSol,
  };
}

interface Board {
  handle: string;
  address: string;
  accuracy: number;
  streak: number;
  calls: number;
}

const BOTS: Board[] = [
  { handle: '0xGoalOracle', address: 'bot1', accuracy: 74, streak: 6, calls: 188 },
  { handle: 'CornerKing', address: 'bot2', accuracy: 71, streak: 4, calls: 240 },
  { handle: 'MerkleMbappe', address: 'bot3', accuracy: 69, streak: 9, calls: 156 },
  { handle: 'chain_samba', address: 'bot4', accuracy: 66, streak: 2, calls: 312 },
  { handle: 'ProofOfPitch', address: 'bot5', accuracy: 63, streak: 3, calls: 98 },
  { handle: 'solana_ultra', address: 'bot6', accuracy: 61, streak: 1, calls: 144 },
  { handle: 'OffsideTrap', address: 'bot7', accuracy: 58, streak: 0, calls: 76 },
];

function boardEntries(): Board[] {
  const real = allLedgers().map((ledger) => ({
    handle: ledger.handle,
    address: ledger.address,
    accuracy: accuracyPct(ledger.wonCalls, ledger.totalCalls),
    streak: ledger.streak,
    calls: ledger.totalCalls,
  }));
  return [...BOTS, ...real].sort(
    (a, b) => b.accuracy - a.accuracy || b.streak - a.streak || b.calls - a.calls,
  );
}

function rankOf(address: string): number {
  const index = boardEntries().findIndex((entry) => entry.address === address);
  return index < 0 ? boardEntries().length + 1 : index + 1;
}

export function leaderboard(address: string): LeaderboardDto {
  return {
    entries: boardEntries().map((entry, index) => ({
      rank: index + 1,
      handle: entry.handle,
      accuracy: entry.accuracy,
      streak: entry.streak,
      calls: entry.calls,
      you: entry.address === address,
    })),
  };
}

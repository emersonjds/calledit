import type { Prediction } from "@/entities/prediction";
import type { MatchEventType } from "@/entities/match";
import { MATCH_FULL_MIN, MATCH_MIN_PER_SEC, STARTING_BALANCE_SOL } from "./config";
import { seedFromString } from "./prng";

export interface AddressLedger {
  address: string;
  handle: string;
  balanceSol: number;
  streak: number;
  bestStreak: number;
  wonCalls: number;
  totalCalls: number;
  predictions: Prediction[]; // newest first
}

/** Private settlement record — never returned to the client, keeps settle deterministic. */
export interface ResolutionRecord {
  id: string;
  address: string;
  seed: number;
  eventType: MatchEventType;
  atClockMin: number;
  windowMin: number;
  resolveAtMs: number;
}

interface MockState {
  matchSeed: number;
  matchStartMs: number;
  seq: number;
  ledgers: Record<string, AddressLedger>;
  resolutions: Record<string, ResolutionRecord>;
}

const STORAGE_KEY = "called-it:mock-state";

function freshMatch(nowMs: number): Pick<MockState, "matchSeed" | "matchStartMs"> {
  return { matchSeed: seedFromString(`match-${nowMs}`), matchStartMs: nowMs };
}

function load(): MockState {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockState;
  } catch {
    // ignore malformed storage — start clean
  }
  return { ...freshMatch(now), seq: 1, ledgers: {}, resolutions: {} };
}

const state: MockState = load();

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full / unavailable — demo keeps running from memory
  }
}

/** Restart the fixture when it reaches full time so the home screen is always live. */
export function getMatch(): { seed: number; elapsedSec: number } {
  const now = Date.now();
  let elapsedSec = (now - state.matchStartMs) / 1000;
  if (elapsedSec * MATCH_MIN_PER_SEC >= MATCH_FULL_MIN) {
    Object.assign(state, freshMatch(now));
    elapsedSec = 0;
    persist();
  }
  return { seed: state.matchSeed, elapsedSec };
}

export function currentClockMin(): number {
  const { elapsedSec } = getMatch();
  return Math.floor(elapsedSec * MATCH_MIN_PER_SEC);
}

export function nextSeq(): number {
  return state.seq++;
}

export function getLedger(address: string): AddressLedger {
  let ledger = state.ledgers[address];
  if (!ledger) {
    ledger = {
      address,
      handle: address.startsWith("guest") ? "Guest" : "ProPredictor",
      balanceSol: STARTING_BALANCE_SOL,
      streak: 0,
      bestStreak: 0,
      wonCalls: 0,
      totalCalls: 0,
      predictions: [],
    };
    state.ledgers[address] = ledger;
    persist();
  }
  return ledger;
}

export function saveResolution(record: ResolutionRecord): void {
  state.resolutions[record.id] = record;
  persist();
}

export function getResolution(id: string): ResolutionRecord | undefined {
  return state.resolutions[id];
}

export function commitPersist(): void {
  persist();
}

export function allLedgers(): AddressLedger[] {
  return Object.values(state.ledgers);
}

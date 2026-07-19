import type { Prediction } from '@/entities/prediction';
import type { MatchEventType } from '@/entities/match';
import type { WalletActivity, WalletOverview } from '@/entities/wallet';
import {
  FIAT_CURRENCY,
  FIAT_RATE,
  MATCH_FULL_MIN,
  MATCH_MIN_PER_SEC,
  STARTING_BALANCE_SOL,
} from './config';
import { seedFromString } from './prng';

export interface AddressLedger {
  address: string;
  handle: string;
  balanceSol: number;
  streak: number;
  bestStreak: number;
  wonCalls: number;
  totalCalls: number;
  predictions: Prediction[];
  activity: WalletActivity[];
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

const STORAGE_KEY = 'called-it:mock-state';

function freshMatch(nowMs: number): Pick<MockState, 'matchSeed' | 'matchStartMs'> {
  return { matchSeed: seedFromString(`match-${nowMs}`), matchStartMs: nowMs };
}

function load(): MockState {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockState;
  } catch {}
  return { ...freshMatch(now), seq: 1, ledgers: {}, resolutions: {} };
}

const state: MockState = load();

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

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
    const now = Date.now();
    ledger = {
      address,
      handle: address.startsWith('guest') ? 'Guest' : 'ProPredictor',
      balanceSol: STARTING_BALANCE_SOL,
      streak: 0,
      bestStreak: 0,
      wonCalls: 0,
      totalCalls: 0,
      predictions: [],
      activity: [
        {
          id: `act_${seedFromString(address)}`,
          type: 'deposit',
          amountSol: STARTING_BALANCE_SOL,
          fiatAmount: round2(STARTING_BALANCE_SOL * FIAT_RATE),
          method: 'on-ramp',
          status: 'settled',
          ts: now,
        },
      ],
    };
    state.ledgers[address] = ledger;
    persist();
  } else if (!ledger.activity) {
    ledger.activity = [];
    persist();
  }
  return ledger;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function pushActivity(address: string, activity: WalletActivity): void {
  getLedger(address).activity.unshift(activity);
  persist();
}

export function walletOverview(address: string): WalletOverview {
  const ledger = getLedger(address);
  return {
    address,
    balanceSol: ledger.balanceSol,
    currency: FIAT_CURRENCY,
    fiatRate: FIAT_RATE,
    activity: ledger.activity.slice(0, 30),
  };
}

export function deposit(address: string, amountSol: number): WalletOverview {
  const ledger = getLedger(address);
  ledger.balanceSol = round2(ledger.balanceSol + amountSol);
  ledger.activity.unshift({
    id: `act_${nextSeq()}`,
    type: 'deposit',
    amountSol,
    fiatAmount: round2(amountSol * FIAT_RATE),
    method: 'on-ramp',
    status: 'settled',
    ts: Date.now(),
  });
  persist();
  return walletOverview(address);
}

export type WithdrawResult = { ok: true; wallet: WalletOverview } | { ok: false; error: string };

export function withdraw(address: string, amountSol: number, method: string): WithdrawResult {
  const ledger = getLedger(address);
  if (amountSol <= 0) return { ok: false, error: 'Amount must be positive' };
  if (amountSol > ledger.balanceSol) return { ok: false, error: 'Insufficient balance' };
  ledger.balanceSol = round2(ledger.balanceSol - amountSol);
  ledger.activity.unshift({
    id: `act_${nextSeq()}`,
    type: 'withdraw',
    amountSol,
    fiatAmount: round2(amountSol * FIAT_RATE),
    method,
    status: 'pending',
    ts: Date.now(),
  });
  persist();
  return { ok: true, wallet: walletOverview(address) };
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

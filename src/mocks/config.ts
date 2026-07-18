/** Demo match identity + time compression. One live World Cup fixture drives the app. */
export const DEMO_MATCH_ID = 'wc26-bra-fra';

export const HOME_TEAM = { code: 'BRA', name: 'Brazil', flag: '🇧🇷' } as const;
export const AWAY_TEAM = { code: 'FRA', name: 'France', flag: '🇫🇷' } as const;

/** Match minutes advanced per real second (~128s of real time = a full 90'). */
export const MATCH_MIN_PER_SEC = 0.7;

/** Total playable match minutes before the engine restarts with a fresh seed. */
export const MATCH_FULL_MIN = 98;

export const STARTING_BALANCE_SOL = 4.2;

/** Off-ramp: SOL ↔ local fiat (mocked rate; real build quotes a ramp/exchange partner). */
export const FIAT_CURRENCY = 'BRL';
export const FIAT_RATE = 812.35; // BRL per 1 SOL
export const WITHDRAW_FEE_PCT = 0.015;

/** Resolution window per market, in match-minutes (real seconds = window / MATCH_MIN_PER_SEC). */
export const WINDOW_MIN: Record<string, number> = {
  corner: 6,
  card: 10,
  goal: 16,
  foul: 4,
};

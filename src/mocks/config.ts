export const DEMO_MATCH_ID = 'eng-fra-6-4';

export const HOME_TEAM = { code: 'ENG', name: 'England', flag: '🇬🇧' } as const;
export const AWAY_TEAM = { code: 'FRA', name: 'France', flag: '🇫🇷' } as const;

export const MATCH_MIN_PER_SEC = 0.8;

export const MATCH_FULL_MIN = 96;

export const STARTING_BALANCE_SOL = 4.2;

export const FIAT_CURRENCY = 'BRL';
export const FIAT_RATE = 812.35;
export const WITHDRAW_FEE_PCT = 0.015;

export const WINDOW_MIN: Record<string, number> = {
  corner: 4,
  card: 10,
  goal: 16,
  foul: 4,
};

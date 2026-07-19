import type { Period } from './types';

/**
 * TxLINE period prefix added to a base stat key (1/2 goals, 3/4 yellow, 5/6 red, 7/8 corner).
 * Settlement queries the provable Merkle stat under `prefix + baseKey`.
 */
const PERIOD_PREFIX: Record<Period, number> = {
  '1H': 1000,
  HT: 1000,
  '2H': 3000,
  ET: 4000,
  PENS: 6000,
  FT: 0,
};

export function periodKey(period: Period, baseKey: number): number {
  return PERIOD_PREFIX[period] + baseKey;
}

export function periodLabel(period: Period): string {
  const labels: Record<Period, string> = {
    '1H': '1st Half',
    HT: 'Half Time',
    '2H': '2nd Half',
    ET: 'Extra Time',
    PENS: 'Penalties',
    FT: 'Full Time',
  };
  return labels[period];
}

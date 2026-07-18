import { describe, expect, it } from 'vitest';
import { accuracyPct, effectiveMultiplier, potentialPayout, streakBonus } from './payout';

describe('streakBonus', () => {
  it('is 1x below 3, 1.5x at 3-4, 2x at 5+', () => {
    expect(streakBonus(0)).toBe(1);
    expect(streakBonus(2)).toBe(1);
    expect(streakBonus(3)).toBe(1.5);
    expect(streakBonus(4)).toBe(1.5);
    expect(streakBonus(5)).toBe(2);
    expect(streakBonus(9)).toBe(2);
  });
});

describe('effectiveMultiplier', () => {
  it('multiplies market base by the streak bonus', () => {
    expect(effectiveMultiplier(2.4, 0)).toBe(2.4);
    expect(effectiveMultiplier(2.4, 3)).toBe(3.6);
    expect(effectiveMultiplier(8.5, 5)).toBe(17);
  });
});

describe('potentialPayout', () => {
  it('is stake times multiplier, rounded to cents', () => {
    expect(potentialPayout(5, 2.4)).toBe(12);
    expect(potentialPayout(1, 8.5)).toBe(8.5);
    expect(potentialPayout(3.33, 1.5)).toBe(5);
  });
});

describe('accuracyPct', () => {
  it('rounds and guards divide-by-zero', () => {
    expect(accuracyPct(0, 0)).toBe(0);
    expect(accuracyPct(68, 100)).toBe(68);
    expect(accuracyPct(2, 3)).toBe(67);
  });
});

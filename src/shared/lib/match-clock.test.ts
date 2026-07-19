import { describe, expect, it } from 'vitest';
import { liveMatchMinute } from './match-clock';

const MIN = 60_000;
const kickoff = 1_000_000_000_000;

describe('liveMatchMinute', () => {
  it('is 0 before kickoff', () => {
    expect(liveMatchMinute(kickoff, kickoff - 5 * MIN)).toBe(0);
  });

  it('tracks raw minutes through the first half', () => {
    expect(liveMatchMinute(kickoff, kickoff + 30 * MIN)).toBe(30);
    expect(liveMatchMinute(kickoff, kickoff + 45 * MIN)).toBe(45);
  });

  it('holds at 45 across the halftime break', () => {
    expect(liveMatchMinute(kickoff, kickoff + 55 * MIN)).toBe(45);
  });

  it('subtracts the break in the second half', () => {
    expect(liveMatchMinute(kickoff, kickoff + 105 * MIN)).toBe(90);
  });

  it('caps at 120', () => {
    expect(liveMatchMinute(kickoff, kickoff + 200 * MIN)).toBe(120);
  });
});

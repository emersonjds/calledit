/** Consecutive wins raise the multiplier; a loss resets it. Skill, not luck. */
export function streakBonus(currentStreak: number): number {
  if (currentStreak >= 5) return 2;
  if (currentStreak >= 3) return 1.5;
  return 1;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Effective multiplier locked at commit: market base × streak bonus. */
export function effectiveMultiplier(baseMultiplier: number, currentStreak: number): number {
  return round2(baseMultiplier * streakBonus(currentStreak));
}

export function potentialPayout(stakeSol: number, multiplier: number): number {
  return round2(stakeSol * multiplier);
}

export function accuracyPct(won: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((won / total) * 100);
}

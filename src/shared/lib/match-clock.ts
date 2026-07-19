/**
 * Live match minute derived from kickoff + wall-clock. The TxLINE feed carries
 * no match-clock minute (it is always 0), so kickoff is the only real source of
 * the running minute in LIVE mode.
 */
export function liveMatchMinute(kickoffMs: number, nowMs: number = Date.now()): number {
  const rawMin = Math.floor((nowMs - kickoffMs) / 60_000);
  if (rawMin <= 0) return 0;
  if (rawMin <= 45) return rawMin;
  return Math.min(120, Math.max(45, rawMin - 15));
}

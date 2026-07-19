/**
 * Live match minute derived from kickoff + wall-clock. The TxLINE feed carries
 * no match-clock minute (it is always 0), so kickoff is the only real source of
 * the running minute in LIVE mode.
 *
 * ponytail: trivial halftime handling — subtracts a fixed 15' break once past
 * the 45th minute, and no stoppage time. Upgrade to a period-aware clock (using
 * the feed `period`) if the header ever needs exact added time.
 */
export function liveMatchMinute(kickoffMs: number, nowMs: number = Date.now()): number {
  const rawMin = Math.floor((nowMs - kickoffMs) / 60_000);
  if (rawMin <= 0) return 0;
  if (rawMin <= 45) return rawMin;
  return Math.min(120, Math.max(45, rawMin - 15));
}

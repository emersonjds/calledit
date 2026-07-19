export function formatSol(value: number, digits = 2): string {
  return `${value.toFixed(digits)} SOL`;
}

export function shortAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function shortHash(hash: string): string {
  if (hash.length <= 8) return hash;
  return `${hash.slice(0, 4)}…${hash.slice(-3)}`;
}

export function formatClock(clockMin: number): string {
  return `${Math.max(0, Math.floor(clockMin))}'`;
}

export function formatTimeOfDay(ms: number): string {
  const date = new Date(ms);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatMultiplier(value: number): string {
  return `${value}x`;
}

export function formatFiat(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
}

export function formatKickoff(kickoffMs: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(kickoffMs));
}

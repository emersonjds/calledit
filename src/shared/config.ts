export type AppMode = 'live' | 'demo';

const MODE_KEY = 'called-it:mode';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

// Pure so it is unit-testable; the two args are the only inputs.
export function resolveMode(persisted: string | null, forceDemoEnv: string | undefined): AppMode {
  if (persisted === 'demo' || persisted === 'live') return persisted;
  return forceDemoEnv === 'true' ? 'demo' : 'live';
}

export function getMode(): AppMode {
  const persisted = typeof localStorage !== 'undefined' ? localStorage.getItem(MODE_KEY) : null;
  return resolveMode(persisted, import.meta.env.VITE_FORCE_DEMO);
}

export function isDemo(): boolean {
  return getMode() === 'demo';
}

export function persistMode(mode: AppMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

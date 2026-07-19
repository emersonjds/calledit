export type AppMode = 'live' | 'demo';

const MODE_KEY = 'called-it:mode';

// No VITE_API_BASE_URL set → the real backend isn't wired yet, so MSW serves '/api' on this origin.
export const hasRealBackend: boolean = Boolean(import.meta.env.VITE_API_BASE_URL);
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api';

// Devnet by default to match the app's settlement cluster. Override via VITE_SOLANA_RPC_URL
// (e.g. mainnet-beta) — never hardcode mainnet here.
export const SOLANA_RPC_URL: string =
  import.meta.env.VITE_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';

// Devnet treasury (service wallet) that receives real stake transfers. Must equal the backend's
// service pubkey so verification doesn't drift. Override via VITE_TREASURY_ADDRESS.
export const TREASURY_ADDRESS: string =
  import.meta.env.VITE_TREASURY_ADDRESS ?? '2t5SHE9udJWswb5GqKMzvRhE836uyzkdkQJGf1sHhi8p';

// The real TxLINE fixture the live match tracks by default (Spain vs Argentina). Override per event.
export const LIVE_MATCH_ID: string = import.meta.env.VITE_LIVE_MATCH_ID ?? '18257739';

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

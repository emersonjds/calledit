# calledit-api integration + demo mode + wallet modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Run the app against the real `calledit-api` (real TxODDS fixtures + real prediction persistence), keep an explicit demo mode (MSW), and revamp sign-in into a wallet modal (Phantom/Solflare/Backpack/MetaMask + Google/Create/guest/demo).

**Architecture:** Env-driven live/demo switch. Live mode: `BASE=VITE_API_BASE_URL` (default `http://localhost:3000/api`), MSW never starts. Demo mode: `BASE=/api`, MSW simulation runs, "Simulated data" badge shows. Client owns the wallet address (backend `wallet/connect` is a stub). Design + real shapes: see `docs/superpowers/specs/2026-07-18-calledit-api-integration-design.md` and `scratchpad/calledit-api-contract.md`.

**Tech Stack:** Vite + React 19 + TS + Tailwind + shadcn/ui + Zustand + React Query + MSW + Vitest. Backend already proven running locally (real fixtures confirmed).

## Global Constraints

- UI text English. Design tokens only. Dark-only, mobile-first, max-w 430px.
- No `any`; avoid new `as` casts (existing `as Promise<...>` in client.ts may stay). Named interfaces. No single-letter identifiers.
- FSD import direction; never upward/sideways within a layer.
- No new runtime dependency (playwright is devDep, E2E only).
- Never present stub/placeholder data as real. Predictions honestly show `resolving`.
- Atomic commits, English lowercase imperative, no trailing period, NO AI/Claude mention, no `Co-Authored-By`. Author is the developer.
- `// ponytail:` marks deliberate shortcuts.

---

### Task 1: Live/demo runtime source switch + client-owned address

**Files:**

- Create: `src/shared/config.ts`
- Create: `src/store/app-mode.ts`
- Modify: `src/shared/api/client.ts` (BASE)
- Modify: `src/main.tsx` (start MSW only in demo)
- Modify: `src/features/wallet.ts` (`useConnectWallet` keeps client address in live mode)
- Test: `src/shared/config.test.ts`

**Interfaces:**

- Produces: `API_BASE_URL: string`, `getMode(): 'live'|'demo'`, `isDemo(): boolean` from `shared/config`; `useAppMode` store with `mode`, `enterDemo()`, `exitDemo()`.

- [ ] **Step 1: Write the failing test for config mode resolution**

```ts
// src/shared/config.test.ts
import { afterEach, describe, expect, it } from 'vitest';
import { resolveMode } from './config';

afterEach(() => localStorage.clear?.());

describe('resolveMode', () => {
  it('defaults to live when nothing is set', () => {
    expect(resolveMode(null, undefined)).toBe('live');
  });
  it('honors a persisted demo choice over the default', () => {
    expect(resolveMode('demo', undefined)).toBe('demo');
  });
  it('honors a persisted live choice even when force-demo env is set', () => {
    expect(resolveMode('live', 'true')).toBe('live');
  });
  it('falls back to demo when force-demo env is set and no choice persisted', () => {
    expect(resolveMode(null, 'true')).toBe('demo');
  });
});
```

Provide a `localStorage` shim at the top of the test (same pattern as `src/shared/lib/solana-keypair.test.ts`).

- [ ] **Step 2: Run test — verify it fails** (`pnpm test src/shared/config.test.ts` → cannot resolve `resolveMode`).

- [ ] **Step 3: Implement `src/shared/config.ts`**

```ts
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
```

- [ ] **Step 4: Run test — verify pass.**

- [ ] **Step 5: Create the app-mode store `src/store/app-mode.ts`**

```ts
import { create } from 'zustand';
import { getMode, persistMode, type AppMode } from '@/shared/config';

interface AppModeState {
  mode: AppMode;
  enterDemo: () => void;
  exitDemo: () => void;
}

// enterDemo/exitDemo persist then reload, so bootstrap re-runs and MSW starts/stops cleanly.
export const useAppMode = create<AppModeState>((set) => ({
  mode: getMode(),
  enterDemo: () => {
    persistMode('demo');
    set({ mode: 'demo' });
    window.location.assign('/onboarding');
  },
  exitDemo: () => {
    persistMode('live');
    set({ mode: 'live' });
    window.location.assign('/onboarding');
  },
}));
```

- [ ] **Step 6: Point the client BASE at the real API in live mode**

In `src/shared/api/client.ts`, replace `const BASE = '/api';` with:

```ts
import { API_BASE_URL, isDemo } from '@/shared/config';

// Demo → MSW-intercepted '/api'; live → real calledit-api.
const BASE = isDemo() ? '/api' : API_BASE_URL;
```

- [ ] **Step 7: Start MSW only in demo mode**

In `src/main.tsx`, replace the mock-start condition:

```ts
import { isDemo } from '@/shared/config';
// ...
async function bootstrap() {
  if (isDemo()) {
    const { startMockServer } = await import('@/mocks/browser');
    await startMockServer();
  }
  // ...unchanged render
}
```

- [ ] **Step 8: Keep the client address as source of truth in live mode**

In `src/features/wallet.ts`, the backend `wallet/connect` returns a stub address in live mode. When the caller already knows the address (embedded/created/injected wallet), trust it. Update `useConnectWallet`:

```ts
export function useConnectWallet() {
  const connect = useSession((state) => state.connect);
  return useMutation({
    mutationFn: ({ provider, address }: { provider: string; address?: string }) =>
      api.connectWallet(provider, address),
    // In live mode the backend echoes a stub address; if the caller supplied a real one, keep it.
    onSuccess: (account, { address }) => connect(address ? { ...account, address } : account),
  });
}
```

- [ ] **Step 9: Type-check + build + test, then commit**

```bash
pnpm type-check && pnpm build && pnpm test
git add src/shared/config.ts src/shared/config.test.ts src/store/app-mode.ts src/shared/api/client.ts src/main.tsx src/features/wallet.ts
git commit -m "add live/demo source switch and client-owned address"
```

---

### Task 2: Demo entry + simulated-data badge + honest markers

**Files:**

- Create: `src/widgets/demo-badge.tsx`
- Modify: `src/app/layout.tsx` (mount badge)
- Modify: `src/pages/onboarding.tsx` (add "Enter as demo")

**Interfaces:**

- Consumes: `useAppMode` (Task 1).
- Produces: `DemoBadge` widget (self-hides when not demo).

- [ ] **Step 1: Build the badge**

```tsx
// src/widgets/demo-badge.tsx
import { useAppMode } from '@/store/app-mode';

export function DemoBadge() {
  const mode = useAppMode((state) => state.mode);
  const exitDemo = useAppMode((state) => state.exitDemo);
  if (mode !== 'demo') return null;
  return (
    <div className="border-flame/40 bg-card mx-auto mb-2 flex max-w-[430px] items-center justify-between gap-2 rounded-full border px-3 py-1">
      <span className="text-flame text-xs font-semibold">Simulated data · Demo</span>
      <button
        onClick={exitDemo}
        className="text-muted-foreground text-xs underline"
        aria-label="Exit demo"
      >
        Exit
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Mount the badge in `AppLayout`** (above `<Outlet />`, alongside the existing `SolanaWalletNudge`):

```tsx
import { DemoBadge } from '@/widgets/demo-badge';
// inside <main>, first child:
<DemoBadge />;
```

- [ ] **Step 3: Add "Enter as demo" to onboarding**

In `src/pages/onboarding.tsx`, import `useAppMode` and add a button below "Play as guest" that calls `enterDemo()`:

```tsx
import { useAppMode } from '@/store/app-mode';
// ...
const enterDemo = useAppMode((state) => state.enterDemo);
// ...button:
<Button size="lg" variant="ghost" onClick={enterDemo} className="text-flame h-11 w-full text-sm">
  Enter as demo (simulated)
</Button>;
```

Note: `enterDemo` persists mode=demo and reloads to `/onboarding`; MSW then starts on bootstrap. After the reload the same screen is shown but now in demo mode (badge visible once connected). The user then picks a login (guest works offline in demo).

- [ ] **Step 4: Type-check + build, then commit**

```bash
pnpm type-check && pnpm build
git add src/widgets/demo-badge.tsx src/app/layout.tsx src/pages/onboarding.tsx
git commit -m "add demo entry and simulated-data badge"
```

---

### Task 3: Wallet modal revamp (Phantom/Solflare/Backpack/MetaMask detection)

**Files:**

- Create: `src/entities/wallet/adapters.ts` (injected-provider detection + connect)
- Create: `src/widgets/wallet-modal.tsx`
- Modify: `src/pages/onboarding.tsx` (open the modal instead of flat buttons)
- Test: `src/entities/wallet/adapters.test.ts`

**Interfaces:**

- Consumes: `useConnectWallet` (Task 1), `createEmbeddedWallet`/`saveEmbeddedWallet` + `CreateWalletSheet`, `useAppMode`.
- Produces: `detectWallets(): WalletOption[]` where `WalletOption = { id, label, chain, installed, connect?: () => Promise<string> }` (connect resolves the real address); `WalletModal` widget.

- [ ] **Step 1: Write the failing test for detection**

```ts
// src/entities/wallet/adapters.test.ts
import { afterEach, describe, expect, it } from 'vitest';
import { detectWallets } from './adapters';

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe('detectWallets', () => {
  it('marks a wallet installed when its provider is injected', () => {
    (globalThis as { window?: Record<string, unknown> }).window = {
      phantom: { solana: { isPhantom: true } },
    };
    const phantom = detectWallets().find((option) => option.id === 'phantom');
    expect(phantom?.installed).toBe(true);
  });
  it('marks all wallets not installed when nothing is injected', () => {
    (globalThis as { window?: Record<string, unknown> }).window = {};
    expect(detectWallets().every((option) => !option.installed)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — verify fail.**

- [ ] **Step 3: Implement `src/entities/wallet/adapters.ts`**

```ts
import type { ChainKind } from './types';

export interface WalletOption {
  id: string;
  label: string;
  chain: ChainKind;
  installLink: string;
  installed: boolean;
  connect?: () => Promise<string>;
}

interface SolanaProvider {
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
}
interface EvmProvider {
  request: (args: { method: string }) => Promise<string[]>;
}

function solanaConnect(provider: SolanaProvider): () => Promise<string> {
  return async () => (await provider.connect()).publicKey.toString();
}
function evmConnect(provider: EvmProvider): () => Promise<string> {
  return async () => {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  };
}

// Reads injected globals; pure w.r.t. the current window so it is testable.
export function detectWallets(): WalletOption[] {
  const win = (typeof window !== 'undefined' ? window : {}) as Record<string, unknown>;
  const phantom = (win.phantom as { solana?: SolanaProvider } | undefined)?.solana;
  const solflare = win.solflare as (SolanaProvider & { isSolflare?: boolean }) | undefined;
  const backpack = win.backpack as SolanaProvider | undefined;
  const ethereum = win.ethereum as EvmProvider | undefined;
  return [
    {
      id: 'phantom',
      label: 'Phantom',
      chain: 'solana',
      installLink: 'https://phantom.app',
      installed: Boolean(phantom),
      connect: phantom && solanaConnect(phantom),
    },
    {
      id: 'solflare',
      label: 'Solflare',
      chain: 'solana',
      installLink: 'https://solflare.com',
      installed: Boolean(solflare),
      connect: solflare && solanaConnect(solflare),
    },
    {
      id: 'backpack',
      label: 'Backpack',
      chain: 'solana',
      installLink: 'https://backpack.app',
      installed: Boolean(backpack),
      connect: backpack && solanaConnect(backpack),
    },
    {
      id: 'metamask',
      label: 'MetaMask',
      chain: 'evm',
      installLink: 'https://metamask.io',
      installed: Boolean(ethereum),
      connect: ethereum && evmConnect(ethereum),
    },
  ];
}
```

- [ ] **Step 4: Run test — verify pass.**

- [ ] **Step 5: Build `src/widgets/wallet-modal.tsx`** — a "Log in or sign up" dialog listing the detected wallets (installed → connect via `option.connect()` then `connect.mutate({ provider: option.id, address })`; not installed → an anchor to `installLink`), plus Continue with Google, Create a Solana wallet, Play as guest, and Enter as demo. Reuse `shared/ui/dialog` (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`), `Button`, and `CreateWalletSheet`. On a successful connect, call an `onConnected` prop. For a wallet with no injected provider (`installed: false`), the row is a link, not a connect. All text English, tokens only. Icons from `lucide-react` (`Wallet`), wallet brand marks as their initial letter in a rounded chip (no new asset dependency).

Concrete row behavior:

```tsx
// installed wallet:
onClick={async () => {
  if (!option.connect) return;
  const address = await option.connect();
  connect.mutate({ provider: option.id, address }, { onSuccess: onConnected });
}}
// not installed: render an <a href={option.installLink} target="_blank" rel="noreferrer"> … Install </a>
```

- [ ] **Step 6: Wire the modal into onboarding** — replace the individual Phantom/MetaMask buttons in `src/pages/onboarding.tsx` with a single primary button `Connect a wallet` that opens `WalletModal`; keep Continue with Google and Enter as demo directly on the screen if desired, or move all into the modal (match the reference: one entry that opens the modal). Keep `goHome` as the `onConnected` handler. Preserve the existing `CreateWalletSheet` and guest paths through the modal.

- [ ] **Step 7: Type-check + build + test, then commit**

```bash
pnpm type-check && pnpm build && pnpm test
git add src/entities/wallet/adapters.ts src/entities/wallet/adapters.test.ts src/widgets/wallet-modal.tsx src/pages/onboarding.tsx
git commit -m "add wallet modal with injected provider detection"
```

---

### Task 4: Honest markers on stub/placeholder surfaces

**Files:**

- Modify: the fixtures/matches widget and the profile/leaderboard/wallet screens to show a small "stub"/"placeholder" marker in live mode where the backend data is not real (wallet balance, profile stats, leaderboard, feed placeholder teams). Reuse `DemoBadge`'s pill styling or a shared `<DataNote>` mini-component.

**Interfaces:**

- Consumes: `isDemo`/`getMode`. In live mode only, surfaces backed by backend stubs render a subtle "demo values" note so nothing reads as real. Fixtures (real) and predictions (real persistence) get NO marker.

- [ ] **Step 1: Add a shared marker** `src/shared/ui/data-note.tsx` — a tiny inline pill: `<span className="text-muted-foreground text-[10px]">{children}</span>`.
- [ ] **Step 2: In live mode**, add "placeholder" notes to: the live-match feed (teams are placeholder until the ingester maps fixtures), the wallet balance/activity, profile stats, and leaderboard. Gate with `getMode() === 'live'` (in demo the badge already covers it). Do NOT mark the fixtures list or a persisted prediction.
- [ ] **Step 3: Type-check + build, commit** `git commit -m "mark backend stub surfaces as placeholder in live mode"`.

---

## Verification (after all tasks)

- `calledit-api` running locally (proven: real fixtures returned).
- FE live mode (`pnpm dev`, no demo): Upcoming Matches shows the REAL TxODDS fixtures (Spain vs Argentina, etc.), not the old BRA×FRA mock; making a prediction persists across reload (`GET /api/predictions?address=`).
- FE demo mode: "Enter as demo" → badge visible, simulated engine drives everything, no requests to :3000.
- Wallet modal: renders Phantom/Solflare/Backpack/MetaMask with correct installed/not-installed states; Google/Create/guest still connect.
- Playwright E2E (devDep) drives onboarding → connected in demo mode (injected wallets absent in headless, so guest/Google/create paths are the automated ones).

## Self-Review notes

- Spec coverage: source switch (T1), client-owned address (T1), demo entry+badge (T2), wallet modal (T3), honesty markers (T4). All spec sections covered.
- Type consistency: `AppMode`, `resolveMode(persisted, forceDemoEnv)`, `WalletOption`, `useConnectWallet({provider,address?})` consistent across tasks.
- No new runtime dep. English UI, tokens only. Verification per task + final E2E.

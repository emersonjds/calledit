# Social login + embedded Solana wallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every user a Solana address the game can settle to — via Google, an app-created embedded wallet, Phantom, MetaMask, or guest — all wired on the front through the existing mocked seam.

**Architecture:** A new pure `shared/lib/solana-keypair.ts` generates a real Ed25519 keypair with the Web Crypto API and base58-encodes it into a valid Solana address. The embedded address flows through the existing `connectWallet(provider, address?)` seam (MSW stands in at the network boundary). UI: onboarding becomes a 5-option login sheet; a create-wallet drawer generates + backs up the wallet; EVM/guest sessions get a post-connect nudge.

**Tech Stack:** Vite + React 19 + TS + Tailwind 4 + shadcn/ui (drawer, sheet, spinner, sonner) + Zustand + React Query + MSW + Vitest.

## Global Constraints

- UI text 100% English. Currency shown: SOL.
- Design tokens only (`bg-background`, `text-lime`, `text-flame`, `bg-card`, …). Dark-only. Mobile-first, max width 430px.
- TypeScript: no `any` (use `unknown` + narrowing); avoid new `as` casts — narrow instead. Named prop interfaces. No single-letter identifiers.
- FSD import rule: `app → pages → widgets → features → entities → shared`. Never upward/sideways.
- No new runtime dependency. Web Crypto is native; Vitest already installed.
- Atomic micro-commits, English imperative messages, lowercase, no trailing period. Never mention AI/Claude/Anthropic; no `Co-Authored-By`. Author is the developer.
- Comments: only the non-obvious _why_ (custody shortcut, chain constraint). Mark deliberate simplifications with `// ponytail:`.

---

### Task 1: Embedded wallet keypair module (`shared/lib/solana-keypair.ts`)

**Files:**

- Create: `src/shared/lib/solana-keypair.ts`
- Test: `src/shared/lib/solana-keypair.test.ts`

**Interfaces:**

- Consumes: Web Crypto (`crypto.subtle`), `atob`, `localStorage`.
- Produces:
  - `interface EmbeddedWallet { address: string; secret: string }`
  - `base58Encode(bytes: Uint8Array): string`
  - `createEmbeddedWallet(): Promise<EmbeddedWallet>`
  - `isEmbeddedWalletSupported(): Promise<boolean>`
  - `saveEmbeddedWallet(wallet: EmbeddedWallet): void`
  - `loadEmbeddedWallet(): EmbeddedWallet | null`
  - `hasEmbeddedWallet(): boolean`

- [ ] **Step 1: Write the failing test**

```ts
// src/shared/lib/solana-keypair.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import {
  base58Encode,
  createEmbeddedWallet,
  hasEmbeddedWallet,
  loadEmbeddedWallet,
  saveEmbeddedWallet,
} from './solana-keypair';

describe('base58Encode', () => {
  it('encodes single bytes', () => {
    expect(base58Encode(new Uint8Array([0]))).toBe('1');
    expect(base58Encode(new Uint8Array([1]))).toBe('2');
  });
  it('preserves leading zero bytes as ones', () => {
    expect(base58Encode(new Uint8Array(32))).toBe('1'.repeat(32));
    const value = new Uint8Array(32);
    value[31] = 1;
    expect(base58Encode(value)).toBe('1'.repeat(31) + '2');
  });
});

describe('createEmbeddedWallet', () => {
  it('returns a valid solana address and a distinct secret each time', async () => {
    const wallet = await createEmbeddedWallet();
    expect(wallet.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    expect(wallet.secret.length).toBeGreaterThan(80);
    const other = await createEmbeddedWallet();
    expect(other.address).not.toBe(wallet.address);
  });
});

describe('embedded wallet storage', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    const shim: Storage = {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      removeItem: (key: string) => store.delete(key),
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    globalThis.localStorage = shim;
  });

  it('round-trips a saved wallet', () => {
    expect(hasEmbeddedWallet()).toBe(false);
    saveEmbeddedWallet({ address: 'ADDR', secret: 'SECRET' });
    expect(hasEmbeddedWallet()).toBe(true);
    expect(loadEmbeddedWallet()).toEqual({ address: 'ADDR', secret: 'SECRET' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/shared/lib/solana-keypair.test.ts`
Expected: FAIL — cannot resolve `./solana-keypair`.

- [ ] **Step 3: Write the implementation**

```ts
// src/shared/lib/solana-keypair.ts
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const STORAGE_KEY = 'called-it:embedded-wallet';

export interface EmbeddedWallet {
  address: string;
  secret: string; // 64-byte Solana secret key (seed||pubkey), base58 — importable into a wallet
}

export function base58Encode(bytes: Uint8Array): string {
  let leadingZeros = 0;
  while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) leadingZeros += 1;
  let value = 0n;
  for (const byte of bytes) value = value * 256n + BigInt(byte);
  let encoded = '';
  while (value > 0n) {
    encoded = BASE58_ALPHABET[Number(value % 58n)] + encoded;
    value /= 58n;
  }
  return '1'.repeat(leadingZeros) + encoded;
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function isEmbeddedWalletSupported(): Promise<boolean> {
  try {
    await crypto.subtle.generateKey({ name: 'Ed25519' }, false, ['sign', 'verify']);
    return true;
  } catch {
    return false;
  }
}

export async function createEmbeddedWallet(): Promise<EmbeddedWallet> {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const seed = base64UrlToBytes(jwk.d ?? '');
  const secretKey = new Uint8Array(64);
  secretKey.set(seed, 0);
  secretKey.set(publicKey, 32);
  return { address: base58Encode(publicKey), secret: base58Encode(secretKey) };
}

// ponytail: hackathon custody — raw secret in localStorage. Swap this module for a KMS / Privy / Turnkey later.
export function saveEmbeddedWallet(wallet: EmbeddedWallet): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
}

export function loadEmbeddedWallet(): EmbeddedWallet | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'address' in parsed &&
      'secret' in parsed &&
      typeof parsed.address === 'string' &&
      typeof parsed.secret === 'string'
    ) {
      return { address: parsed.address, secret: parsed.secret };
    }
    return null;
  } catch {
    return null;
  }
}

export function hasEmbeddedWallet(): boolean {
  return loadEmbeddedWallet() !== null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/shared/lib/solana-keypair.test.ts`
Expected: PASS (all 5).

- [ ] **Step 5: Type-check + commit**

```bash
pnpm type-check
git add src/shared/lib/solana-keypair.ts src/shared/lib/solana-keypair.test.ts
git commit -m "add embedded solana keypair module"
```

---

### Task 2: Route the embedded address through the connect seam

**Files:**

- Modify: `src/entities/wallet/types.ts` (provider doc comment)
- Modify: `src/shared/api/client.ts` (`connectWallet` signature)
- Modify: `src/mocks/handlers.ts` (accept optional `address`)
- Modify: `src/features/wallet.ts` (`useConnectWallet` input)
- Modify: `src/pages/onboarding.tsx` (existing call sites only — full UI rebuild is Task 3)

**Interfaces:**

- Consumes: `EmbeddedWallet.address` from Task 1.
- Produces: `useConnectWallet()` mutation taking `{ provider: string; address?: string }`.

- [ ] **Step 1: Extend the provider doc in `entities/wallet/types.ts`**

Change the `provider` line in `WalletAccount`:

```ts
provider: string; // "phantom" | "metamask" | "google" | "solana" | "guest"
```

- [ ] **Step 2: Accept an optional address in the API client**

In `src/shared/api/client.ts`, replace the `connectWallet` method:

```ts
  connectWallet(provider: string, address?: string): Promise<WalletAccount> {
    return request('/wallet/connect', walletAccountSchema, {
      method: 'POST',
      body: JSON.stringify({ provider, address }),
    }) as Promise<WalletAccount>;
  },
```

- [ ] **Step 3: Use the supplied address in the MSW handler**

In `src/mocks/handlers.ts`, update the connect handler body (lines ~24-27):

```ts
  http.post('/api/wallet/connect', async ({ request }) => {
    const body = (await request.json()) as { provider?: string; address?: string };
    const provider = body.provider ?? 'guest';
    const address = body.address ?? addressFor(provider);
```

(Leave the rest of the handler unchanged.)

- [ ] **Step 4: Update `useConnectWallet` to pass provider + optional address**

In `src/features/wallet.ts`, replace `useConnectWallet`:

```ts
/** Connect a wallet provider through the adapter seam. `address` is set for app-created/embedded wallets. */
export function useConnectWallet() {
  const connect = useSession((state) => state.connect);
  return useMutation({
    mutationFn: ({ provider, address }: { provider: string; address?: string }) =>
      api.connectWallet(provider, address),
    onSuccess: (account) => connect(account),
  });
}
```

- [ ] **Step 5: Fix the existing onboarding call sites**

In `src/pages/onboarding.tsx`, change the `enter` helper so it passes an object:

```ts
const enter = (provider: string) =>
  connect.mutate({ provider }, { onSuccess: () => navigate('/', { replace: true }) });
```

- [ ] **Step 6: Verify type-check + build, then commit**

```bash
pnpm type-check && pnpm build
git add src/entities/wallet/types.ts src/shared/api/client.ts src/mocks/handlers.ts src/features/wallet.ts src/pages/onboarding.tsx
git commit -m "route embedded wallet address through connect seam"
```

Expected: type-check + build clean; app still connects with Phantom/guest as before.

---

### Task 3: Login sheet + create-wallet drawer

**Files:**

- Create: `src/widgets/create-wallet-sheet.tsx`
- Modify: `src/pages/onboarding.tsx` (5-option login layout)

**Interfaces:**

- Consumes: `createEmbeddedWallet`, `saveEmbeddedWallet`, `isEmbeddedWalletSupported`, `loadEmbeddedWallet`, `hasEmbeddedWallet` (Task 1); `useConnectWallet` (Task 2); `Drawer`/`Button`/`Spinner` from `shared/ui`; `toast` from `sonner`.
- Produces: `CreateWalletSheet` widget with props `interface CreateWalletSheetProps { open: boolean; onOpenChange: (open: boolean) => void; onConnected: () => void }`. Given the embedded wallet it saves it and connects as provider `solana`.

- [ ] **Step 1: Build the create-wallet drawer widget**

```tsx
// src/widgets/create-wallet-sheet.tsx
import { useState } from 'react';
import { Copy, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/drawer';
import { useConnectWallet } from '@/features/wallet';
import {
  createEmbeddedWallet,
  saveEmbeddedWallet,
  type EmbeddedWallet,
} from '@/shared/lib/solana-keypair';

export interface CreateWalletSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

type Stage = 'generating' | 'backup' | 'unsupported';

export function CreateWalletSheet({ open, onOpenChange, onConnected }: CreateWalletSheetProps) {
  const [stage, setStage] = useState<Stage>('generating');
  const [wallet, setWallet] = useState<EmbeddedWallet | null>(null);
  const [revealed, setRevealed] = useState(false);
  const connect = useConnectWallet();

  const generate = async () => {
    setStage('generating');
    setRevealed(false);
    try {
      const created = await createEmbeddedWallet();
      setWallet(created);
      setStage('backup');
    } catch {
      setStage('unsupported');
    }
  };

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const finish = () => {
    if (!wallet) return;
    saveEmbeddedWallet(wallet);
    connect.mutate(
      { provider: 'solana', address: wallet.address },
      {
        onSuccess: () => {
          onOpenChange(false);
          onConnected();
        },
      },
    );
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) void generate();
      }}
    >
      <DrawerContent className="bg-card mx-auto max-w-[430px]">
        <DrawerHeader className="text-center">
          <DrawerTitle className="font-display text-lime">Create a Solana wallet</DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Generated on your device. Back up your secret — it is the only way to restore it.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-8">
          {stage === 'generating' && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8">
              <Spinner /> Generating your wallet…
            </div>
          )}

          {stage === 'unsupported' && (
            <p className="text-flame py-8 text-center text-sm">
              Your browser can’t create a wallet here. Update it, or connect Phantom instead.
            </p>
          )}

          {stage === 'backup' && wallet && (
            <>
              <div className="border-border rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Your Solana address</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-foreground font-mono text-xs break-all">
                    {wallet.address}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copy(wallet.address, 'Address')}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="border-flame/40 rounded-lg border p-3">
                <p className="text-flame text-xs">Secret key — never share it</p>
                {revealed ? (
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-foreground font-mono text-xs break-all">
                      {wallet.secret}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copy(wallet.secret, 'Secret')}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => setRevealed(true)}
                  >
                    Reveal secret
                  </Button>
                )}
              </div>

              <Button
                disabled={!revealed || connect.isPending}
                onClick={finish}
                className="bg-lime text-background hover:bg-lime/90 h-12 w-full font-bold"
              >
                <ShieldCheck className="size-5" /> I saved it — continue
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 2: Rebuild the onboarding login sheet**

Replace the `<div className="w-full space-y-3">…</div>` action block in `src/pages/onboarding.tsx` with the 5 options, and add the create-wallet drawer + Google/wallet handlers. Full file:

```tsx
// src/pages/onboarding.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Mail, Wallet } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { CreateWalletSheet } from '@/widgets/create-wallet-sheet';
import { useConnectWallet } from '@/features/wallet';
import {
  createEmbeddedWallet,
  loadEmbeddedWallet,
  saveEmbeddedWallet,
} from '@/shared/lib/solana-keypair';

export function OnboardingPage() {
  const navigate = useNavigate();
  const connect = useConnectWallet();
  const [createOpen, setCreateOpen] = useState(false);

  const goHome = () => navigate('/', { replace: true });

  const enter = (provider: string) => connect.mutate({ provider }, { onSuccess: goHome });

  // Google here is a simulated OAuth backed by the same embedded wallet (real SDK swap is the deferred step).
  const enterWithGoogle = async () => {
    const wallet = loadEmbeddedWallet() ?? (await createEmbeddedWallet());
    saveEmbeddedWallet(wallet);
    connect.mutate({ provider: 'google', address: wallet.address }, { onSuccess: goHome });
  };

  return (
    <div className="bg-background flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-between px-6 py-14 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="border-lime glow-lime relative flex size-32 items-center justify-center rounded-full border-2">
          <Check className="text-lime size-16" strokeWidth={3} />
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-lime text-4xl font-extrabold tracking-tight">
            CALLED IT
          </h1>
          <p className="font-display text-foreground text-2xl font-bold">
            Prove you called <span className="text-lime italic">it</span> first.
          </p>
          <p className="text-muted-foreground mx-auto max-w-xs text-sm">
            Commit a prediction before it happens. It gets stamped on-chain. Nobody can fake a call.
          </p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <Button
          size="lg"
          disabled={connect.isPending}
          onClick={enterWithGoogle}
          className="bg-foreground text-background hover:bg-foreground/90 h-14 w-full text-base font-bold"
        >
          <Mail className="size-5" /> Continue with Google
        </Button>
        <Button
          size="lg"
          disabled={connect.isPending}
          onClick={() => enter('phantom')}
          className="bg-lime text-background hover:bg-lime/90 h-14 w-full text-base font-bold"
        >
          <Wallet className="size-5" /> Connect Phantom
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled={connect.isPending}
            onClick={() => enter('metamask')}
            className="border-border h-12"
          >
            MetaMask
          </Button>
          <Button
            variant="outline"
            disabled={connect.isPending}
            onClick={() => setCreateOpen(true)}
            className="border-border h-12"
          >
            Create wallet
          </Button>
        </div>
        <Button
          size="lg"
          variant="ghost"
          disabled={connect.isPending}
          onClick={() => enter('guest')}
          className="text-muted-foreground h-12 w-full"
        >
          Play as guest
        </Button>
        <p className="text-muted-foreground pt-2 text-xs">
          🔒 Secured by Solana · By connecting you agree to the Terms and confirm you are over 18.
        </p>
      </div>

      <CreateWalletSheet open={createOpen} onOpenChange={setCreateOpen} onConnected={goHome} />
    </div>
  );
}
```

- [ ] **Step 3: Verify the drawer exports match**

Run: `grep -n "export" src/shared/ui/drawer.tsx | grep -E "Drawer(Content|Header|Title|Description)?\\b"`
Expected: `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription` are exported. If a name differs, adjust the imports in Steps 1-2 to match the actual exports.

- [ ] **Step 4: Type-check + build**

Run: `pnpm type-check && pnpm build`
Expected: clean.

- [ ] **Step 5: Manual check in the browser**

Run: `pnpm dev`, open the app. Verify: Continue with Google connects and lands home; Create wallet opens the drawer, generates a real address, requires Reveal before continue, connects. Phantom/MetaMask/guest still connect.

- [ ] **Step 6: Commit**

```bash
git add src/widgets/create-wallet-sheet.tsx src/pages/onboarding.tsx
git commit -m "add social login sheet and create-wallet drawer"
```

---

### Task 4: Post-connect "create a Solana wallet" nudge for EVM/guest

**Files:**

- Create: `src/widgets/solana-wallet-nudge.tsx`
- Modify: `src/app/layout.tsx` (mount the nudge inside the authenticated shell)

**Interfaces:**

- Consumes: `useSession` (`chain`, `provider`), `hasEmbeddedWallet` (Task 1), `CreateWalletSheet` (Task 3).
- Produces: `SolanaWalletNudge` widget (no props) — self-gates on session + embedded-wallet state.

Rationale: Phantom already _is_ a Solana wallet, so it is excluded. The nudge targets `chain === 'evm'` or `provider === 'guest'` sessions that have no embedded wallet yet. Dismissible for the session.

- [ ] **Step 1: Build the nudge widget**

```tsx
// src/widgets/solana-wallet-nudge.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { CreateWalletSheet } from '@/widgets/create-wallet-sheet';
import { useSession } from '@/store/session';
import { hasEmbeddedWallet } from '@/shared/lib/solana-keypair';

export function SolanaWalletNudge() {
  const chain = useSession((state) => state.chain);
  const provider = useSession((state) => state.provider);
  const [dismissed, setDismissed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const needsSolanaWallet = (chain === 'evm' || provider === 'guest') && !hasEmbeddedWallet();

  if (dismissed || !needsSolanaWallet) return null;

  return (
    <>
      <div className="border-flame/40 bg-card mx-auto flex max-w-[430px] items-center gap-3 rounded-lg border px-4 py-3">
        <div className="flex-1">
          <p className="text-foreground text-sm font-semibold">Create a Solana wallet</p>
          <p className="text-muted-foreground text-xs">Needed to play and cash out in SOL.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="bg-lime text-background hover:bg-lime/90 font-bold"
        >
          Create
        </Button>
        <Button size="icon" variant="ghost" onClick={() => setDismissed(true)}>
          <X className="size-4" />
        </Button>
      </div>
      <CreateWalletSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onConnected={() => setDismissed(true)}
      />
    </>
  );
}
```

- [ ] **Step 2: Mount the nudge in `AppLayout`**

`AppLayout` in `src/app/layout.tsx` is the authenticated shell (onboarding is a separate route; connection is gated by `RequireWallet`). Add the import and render the nudge inside `<main>`, above `<Outlet />`:

```tsx
import { SolanaWalletNudge } from '@/widgets/solana-wallet-nudge';

export function AppLayout() {
  return (
    <div className="bg-background relative flex min-h-dvh w-full max-w-[430px] flex-col">
      <main className="flex-1 overflow-y-auto pb-2">
        <SolanaWalletNudge />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 3: Type-check + build**

Run: `pnpm type-check && pnpm build`
Expected: clean.

- [ ] **Step 4: Manual check**

Run: `pnpm dev`. Connect as guest → nudge shows → Create opens the drawer → after connect, nudge hides. Connect with Phantom → no nudge.

- [ ] **Step 5: Commit**

```bash
git add src/widgets/solana-wallet-nudge.tsx src/app/layout.tsx
git commit -m "nudge evm and guest sessions to create a solana wallet"
```

---

## Self-Review notes

- **Spec coverage:** Google (Task 3), Create wallet real keypair (Tasks 1+3), Phantom/MetaMask/guest (Task 2+3), backup step (Task 3), EVM/guest post-connect prompt (Task 4), seam accepts address (Task 2), unit tests (Task 1). All spec sections covered.
- **Deferred (unchanged, as speced):** real Google OAuth, real RPC balance, secure custody — `solana-keypair.ts` is the swap point.
- **Type consistency:** `EmbeddedWallet { address, secret }`, `useConnectWallet({ provider, address? })`, `CreateWalletSheetProps { open, onOpenChange, onConnected }` used consistently across tasks.
- **Verification gate:** every task ends on `pnpm type-check` (+ `pnpm build` where UI changes), Task 1 adds real Vitest tests. UI text English, tokens only, no new deps.

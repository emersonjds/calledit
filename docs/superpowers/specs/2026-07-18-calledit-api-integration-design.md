# Design: calledit-api integration + demo mode + wallet modal revamp

Date: 2026-07-18
Status: approved (decisions locked), pending implementation plan
Contract reference: `scratchpad/calledit-api-contract.md` (real endpoint shapes)

## Goal

Make the app run against the **real `calledit-api`** backend (Fastify + Postgres +
TxODDS TxLINE) instead of only MSW, while keeping an explicit, clearly-labeled
**demo mode** (MSW simulation) — and revamp the wallet sign-in into a proper
"Log in or sign up" modal (Phantom / Solflare / Backpack / MetaMask + Google /
Create wallet / guest).

## Key finding (shrinks the work)

`calledit-api` was built mirroring the frontend's `shared/api/schemas.ts` almost
1:1: **same paths, same response shapes** (`/api/predictions`, `/api/feed/:matchId`,
`/api/fixtures/upcoming`, `/api/wallet`, `/api/me`, `/api/leaderboard`,
`/api/wallet/connect`). No auth on any route. So the integration is mostly:
**turn MSW off and point the base URL at the real API.** No schema rewrite —
only alignment of query params and honest handling of what is real vs stub.

## Honest data reality (milestone 1, running locally with the real `.env`)

- **REAL**: `GET /api/fixtures/upcoming` → live TxODDS World Cup fixtures (the
  `.env` has `TXLINE_*` set locally). `POST/GET /api/predictions` → real Postgres
  persistence.
- **PLACEHOLDER**: `GET /api/feed/:matchId` → real pipeline but empty without the
  SSE ingester running; returns a zeroed snapshot with `BRA/ARG` placeholder
  teams and `clockMin: 0`.
- **STUB (fixed literals in the backend)**: `wallet` connect/overview/deposit/
  withdraw, `/api/me`, `/api/leaderboard`.
- **NOT WIRED**: settlement — predictions never leave `status: 'resolving'`
  (no `won`/`lost` yet).

The UI must not pretend stub/placeholder data is real. Non-real surfaces carry an
honest marker; predictions honestly show `resolving`.

## Architecture

### 1. Runtime source switch (single swap point)

- New `src/shared/config.ts`:
  - `API_BASE_URL` = `import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api'`.
  - `getMode(): 'live' | 'demo'` — `demo` if the user chose "Enter as demo"
    (persisted flag) **or** `VITE_FORCE_DEMO` is set; otherwise `live`.
- `src/shared/api/client.ts` prefixes requests with `API_BASE_URL` in live mode
  and with `/api` (MSW-intercepted) in demo mode.
- `src/main.tsx` / `mocks/browser.ts`: **start MSW only in demo mode.** In live
  mode the worker never registers, so requests hit the real API.
- Demo flag persisted in a tiny store (`store/session.ts` extension or a new
  `store/app-mode.ts`), so a reload keeps demo.

### 2. Address is client-owned in live mode

The backend `POST /api/wallet/connect` returns a fixed `stub-wallet-address` —
useless as an identity. The **client's** wallet address (embedded/created wallet,
or a real injected wallet's pubkey) is the source of truth. In live mode:

- Resolve the address client-side (existing embedded-wallet flow / real adapter).
- Set the session from that address; do **not** overwrite it with the backend
  stub. Send that address as the `?address=` query param to `/api/wallet`,
  `/api/me`, `/api/leaderboard`, and in the prediction body.
- (Backend stubs ignore the address today, but sending the real one keeps the
  contract correct for when they become real.)

### 3. Demo mode

- Onboarding gains an **"Enter as demo"** entry (below the wallet options). It
  sets mode=demo, starts MSW, and connects a demo session (guest-like) so the
  simulated deterministic match engine drives everything.
- A persistent **"Simulated data · Demo"** badge shows app-wide while in demo
  mode (small pill in the top area of `AppLayout`).
- Switching out of demo (disconnect / a "Exit demo" action) clears the flag.

### 4. Wallet modal revamp

- Replace the flat onboarding buttons with a **"Log in or sign up" modal**
  (reuse `shared/ui/dialog` or `drawer`) matching the reference:
  - **Solana wallets**: Phantom, Solflare, Backpack — detect injected providers
    (`window.phantom?.solana`, `window.solflare`, `window.backpack`); installed →
    connect via the real adapter (calls the extension, gets the real pubkey);
    not installed → show "Not installed" with an install link.
  - **EVM**: MetaMask — detect `window.ethereum`.
  - Plus the existing **Continue with Google**, **Create a Solana wallet**, and
    **Play as guest**, and the new **Enter as demo**.
- Real injected-wallet connect flows through the `WalletAdapter` seam; where a
  provider is not injected, fall back to the existing mock-seam connect (demo).
  `// ponytail:` marks the real-signature step (nonce/challenge) as the deferred
  upgrade — milestone-1 connect uses the pubkey only.

## Prerequisite: run `calledit-api` locally

```
cd ../calledit-api
docker compose up -d
./node_modules/.bin/tsx src/db/migrate.ts
./node_modules/.bin/tsx src/server.ts      # http://localhost:3000, real .env → real TxLINE fixtures
```

Verify `GET /health` → `{status:'ok'}` and `GET /api/fixtures/upcoming` returns
real fixtures before wiring the FE to live mode.

## What ships

- Env-driven live/demo switch; MSW only in demo.
- FE pointed at real `calledit-api` (local) — real fixtures + real prediction
  persistence.
- Client-owned address in live mode; correct `?address=` params.
- "Enter as demo" + app-wide "Simulated data" badge.
- Honest markers on stub/placeholder surfaces; predictions show `resolving`.
- Wallet modal with Phantom/Solflare/Backpack/MetaMask detection + Google/Create/
  guest/demo.

## Deferred (explicit)

- Real wallet-signature auth (nonce/challenge) — backend has no verification yet.
- Real feed (needs the TxLINE SSE ingester running) — placeholder teams until then.
- Settlement `won`/`lost` transitions — milestone 3 backend.
- Deployed Render URL — supply via `VITE_API_BASE_URL` when available; local for now.
- Real on-chain stamp (`seq`/`epochDay`/`txHash`) — backend stub until milestone 3.

## Out of scope

- Changing `calledit-api` (except, if fixtures 500 blocks the demo, a minimal
  try/catch fallback in its fixtures route — flagged, not assumed).
- Multi-wallet account switching.

## Testing

- Boot `calledit-api` locally; confirm `/health` and real fixtures.
- FE live mode: fixtures screen shows real World Cup matches; making a prediction
  persists (reload → still there via `GET /api/predictions?address=`).
- FE demo mode: "Enter as demo" → simulated engine + badge; no network to :3000.
- Wallet modal: Phantom/Solflare/Backpack/MetaMask detected states render;
  Google/Create/guest still work; Playwright drives onboarding → connected.

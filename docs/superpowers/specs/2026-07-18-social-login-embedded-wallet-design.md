# Design: Social login + embedded Solana wallet (mock-seam)

Date: 2026-07-18
Status: approved (design), pending implementation plan

## Goal

Give every user a Solana address the game can settle to, reached through the
sign-in method they prefer — social (Google), an app-created embedded wallet,
an external wallet (Phantom / MetaMask), or guest. All wired on the front today
through the existing mocked network seam; no backend, no new runtime dependency,
no API keys.

## Why

The game settles on-chain on Solana (`goal|card|corner` via TxLINE). Today the
onboarding only offers Phantom + guest. Users without a Solana wallet (Google
sign-in, MetaMask/EVM, guest) have no way to actually play/cash out. We need a
simple, honest "create a Solana wallet for you" mechanic and a social entry
point, matching the reference login modal (Google + wallets + create).

## The mechanic

Four entry points, all resolving to a Solana address:

- **Continue with Google** — simulated OAuth → creates or restores an **embedded
  Solana wallet** (real keypair, stored locally). Provider `google`, chain
  `solana`.
- **Create a Solana wallet** — the same embedded wallet, explicit (no Google):
  generate → show the new address → **back up your secret** → done. Provider
  `solana`, chain `solana`.
- **Connect Phantom** — external self-custody Solana. Existing seam. Provider
  `phantom`, chain `solana`.
- **Connect MetaMask** — external EVM. Existing seam. Provider `metamask`, chain
  `evm`. Because settlement is on Solana, an EVM session is prompted post-connect
  to **create a Solana wallet** to play & cash out.
- **Play as guest** — ephemeral. Existing seam. Prompted to create/back up a
  Solana wallet before cashing out.

## Embedded wallet — real on the front

- Generate a real **Ed25519 keypair with the Web Crypto API**
  (`crypto.subtle.generateKey('Ed25519', extractable, ['sign','verify'])`) —
  native, zero new dependency. Requires a recent browser (Chrome 137+, Safari
  17+, Firefox 129+); fall back to a clear "browser unsupported" message rather
  than a silent mock.
- Base58-encode the 32-byte public key → a valid Solana address.
- Store the secret key in namespaced `localStorage` (e.g.
  `called-it:embedded-wallet`), guarded by a **"Back up your wallet"** reveal +
  copy step before the user leaves onboarding.
- `// ponytail:` marks this as hackathon custody — the single swap point to a
  real KMS / Privy / Turnkey later. The keypair module is the only place that
  changes.
- The new address flows through the existing `connectWallet(provider)` seam.
  MSW's `getLedger(address)` lazily provisions any new address with the demo
  starting balance, so a freshly created wallet is immediately playable. On-ramp
  (deposit) already exists.

## UI

- **Login sheet** (replaces the two-button onboarding): the five options above,
  Google primary, wallets secondary, "Create a Solana wallet" and guest below —
  matching the reference modal.
- **Create-wallet flow** (short, in-sheet or bottom sheet via existing `vaul`):
  `generating…` → `here's your Solana address (copy)` → `back up your secret
(reveal + copy, confirm saved)` → `done`.
- **Post-connect prompt** for EVM/guest sessions: "Create a Solana wallet to
  play & cash out." Non-blocking; dismissible.

## Seam / architecture (Feature-Sliced)

- `entities/wallet` — extend `WalletAccount.provider` doc to include `google`,
  `solana`. `ChainKind` unchanged.
- `shared/lib/solana-keypair.ts` — **new**, the only real-crypto module:
  `generateKeypair()`, `base58Encode(bytes)`, `loadStoredWallet()`,
  `storeWallet(secret)`, `revealSecret()`. Pure, unit-testable, no React.
- `features/wallet.ts` — `useConnectWallet` gains the embedded path: for
  `google`/`solana` it generates (or restores) the keypair locally, then sends
  the real address through `connectWallet` so the MSW ledger + session stay the
  single source. Phantom/MetaMask/guest unchanged.
- `mocks/handlers.ts` — `connectWallet` already accepts any provider string;
  accept an optional `address` in the POST body so the embedded wallet's real
  address is used instead of the deterministic `addressFor(provider)`.
- `store/session.ts` — unchanged shape; provider/chain now carry the new values.
- Import rule respected: `pages → features → entities → shared`; no upward/
  sideways imports.

## What ships on the front now

- Full login sheet UI (5 options).
- Real Ed25519 keypair generation + base58 address + local backup flow.
- Embedded-wallet session wired through the existing seam.
- Post-connect "create a Solana wallet" prompt for EVM/guest.
- MSW `connectWallet` accepts a supplied address.

## Deferred (explicitly, not silently)

- Real Google OAuth (needs provider + client id).
- Real on-chain balance / RPC (MSW still stands in at the network boundary).
- Secure key custody (KMS / Privy / Turnkey) — `shared/lib/solana-keypair.ts` is
  the swap point.

## Testing

- Unit: `solana-keypair.ts` — base58 encoding round-trips a known vector;
  generated public key is 32 bytes → 43–44 char base58; store/load/reveal
  round-trips. (Money/settlement paths unaffected.)
- Manual/QA: each of the 5 entry points reaches a connected session with a
  Solana address; created wallet shows a real address and backup; EVM/guest see
  the create-wallet prompt.

## Out of scope

- Changing settlement, TxLINE feed, or prediction flow.
- Multi-wallet management / switching accounts.
- Seed-phrase (mnemonic) import — raw secret backup only for now.

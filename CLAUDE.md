# CLAUDE.md — Called It

Golden rules for all AI-assisted development in this repo. Read fully before any task.

> 📖 Product & technical spec: [`docs/SPEC.md`](docs/SPEC.md) · Implementation plan: [`docs/PLAN.md`](docs/PLAN.md).

---

## 1. Product identity

- **Name**: Called It
- **Domain**: live, on-chain-verified football match prediction/betting game for the FIFA World Cup 2026. You commit a prediction **before** the event; it is stamped on-chain; settlement proves you called it first.
- **Track**: Superteam × TxODDS World Cup Hackathon — **Consumer & Fan Experiences** (also fits Prediction Markets). Deadline **2026-07-19**.
- **Stack**: Vite + React 19 + TypeScript 7 + Tailwind 4 + shadcn/ui + Zustand + React Query + Zod + MSW. PWA, mobile-first.
- **UI language**: **English** in 100% of visible text. Currency shown: **SOL**.

## 2. Visual identity (Stadium Pulse tokens)

- `--lime` `#B6FF3C` — primary, go / win / confirmed
- `--flame` `#FF7A18` — urgency / streak / countdown
- `--background` `#0B0F14` (charcoal), `--card` `#131A21`
- Dark-only. Fonts: display **Anybody**, body **Hanken Grotesk**, mono **JetBrains Mono**.
- Mood: live-betting adrenaline, but **trustworthy** (on-chain proof) — never a cheap casino.

## 3. Git rules — MANDATORY

- **Atomic micro-commits** — one logical change each.
- Messages in **English**, short imperative: `add X`, `fix Y`, `wire Z`. Lowercase, no trailing period.
- **Never mention** Claude, Anthropic, AI, agent, or any AI tool in messages, PRs, or comments.
- **No** `Co-Authored-By` footer or similar.
- Final `git push` is always the human developer's — never push without explicit confirmation.
- Versioned: `.claude/agents/`, `.claude/settings.json`, `.mcp.json`. Never commit `.claude/settings.local.json`, `.serena/`, `.env*`, AI sessions/credentials.

## 4. Code quality

- **Comments: only the strictly necessary.** Comment the non-obvious _why_ of a rule (money, chain constraint, security, timing trap). No comment that narrates what the code already says.
- **Readable in ≤10s** by any level. Small single-purpose functions, clear names, no needless cleverness.
- **Best pattern = simplest that solves it well.** No premature abstraction, no dead code.
- **Performance always on the radar**: no wasteful re-render/recompute/redundant query; structures that scale — but measure before complicating.
- Prefer editing existing files over creating new ones.
- TypeScript: explicit types on public interfaces; **no `any`** (use `unknown` + narrowing); named prop interfaces. No single-letter identifiers.
- Tailwind: mobile-first, use design tokens (`bg-background`, `text-lime`, etc.).

## 5. Architecture — Feature-Sliced Design

```
src/
├── app/        ← router, providers. No business logic.
├── pages/      ← route screens.
├── widgets/    ← composed UI.
├── features/   ← use-cases (connect-wallet, make-prediction, resolve-prediction).
├── entities/   ← domain models (match, prediction, wallet).
├── shared/     ← ui (shadcn), lib, api (typed client).
├── store/      ← zustand session state.
└── mocks/      ← MSW handlers + deterministic match engine.
```

Import rule: only from layers **below** (`app → pages → widgets → features → entities → shared`). Never upward, never sideways within a layer.

## 6. Web3 / data — real domain, mocked network

- The domain is **production-shaped**: transaction building, PDA/`seq`/`epochDay` handling, wallet signing, and the settlement predicate are real. **MSW stands in only at the network boundary** (RPC + TxLINE feed) — it never fakes the domain.
- All I/O lives in `shared/api` + `mocks` — the single MSW↔real swap point. Zero scattered `fetch`.
- **Wallet is chain-agnostic**: `WalletAdapter` interface → **Phantom (Solana)** primary, **MetaMask (EVM)** ready.
- **Provability**: only goals/cards/corners settle on-chain (TxLINE 8 keys, per team/period). `foul` is UI/for-fun only (`provable: false`). Never route a non-provable market to settlement.
- Respect the 5 TxLINE traps (SPEC §7): SL12 not SL1; record feed early; no hardcoded markets; `seq`≥1 + `epochDay` from proof `ts` (never `Date.now()`); no mainnet/devnet mixing.

## 7. Security

- Never commit secrets/keys/JWTs. Wallet keys never leave the wallet.
- Settlement is source of truth on-chain — never trust the client for win/lose or payout.
- Validate every input (Zod) at the API boundary; anti-fraud on prediction integrity.

## 8. Review before done

- [ ] `pnpm type-check` clean · [ ] `pnpm build` clean
- [ ] UI text in English · [ ] Responsive (375/768/1280) · [ ] No `console.log` / debug
- [ ] Unused imports removed · [ ] Money/settlement logic unit-tested

## 9. Agents

Domain specialists: `arq` (web3/on-chain architecture, performance), `back` (Solana/Anchor/CPI, TxLINE feed, wallet adapters, settlement), `front` (frontend web3, signing UX, perf), `pixel` (betting/crypto UX/UI), `redteam` (web3 security & betting integrity). Quality: `bug` (code quality gate), `qa` (E2E + wallet/feed mocking), `scribe` (English docs, glossary). One agent per function.

## 10. Domain glossary

- **Call / prediction**: a stake on a market (`goal|card|corner|foul`) committed before the event.
- **Stamp**: on-chain commitment (tx hash, timestamp, `seq`, `epochDay`) proving _when_ the call was made.
- **Settlement**: the geometric "who called it first / closest" predicate (`validate_stat_v2`) run against the TxLINE Merkle result.
- **Streak / multiplier**: consecutive wins raise the payout multiplier (3→1.5×, 5→2×…); a loss resets it.
- **Provable market**: one backed by the 8 TxLINE keys (goals/cards/corners). `foul` is not provable.
- **`Pct`**: clean win-probability from the feed (house margin removed) — powers the live win-probability meter.

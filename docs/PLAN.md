# Called It — Implementation Plan

Sequenced so the hero loop (watch → call → stamp → resolve) works end-to-end first, then the surrounding screens. Architecture is **production-shaped web3**: the domain model, wallet adapters, transaction-building and settlement flows are real; **MSW stands in only at the network boundary** (RPC + TxLINE feed), never fakes the domain. Swap MSW → real when TxODDS/Solana docs arrive.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## Phase 0 — Foundation (done)

- [x] Vite + React 19 + TS 7 + Tailwind 4 + PWA scaffold
- [x] shadcn/ui (61 components) themed to Called It palette
- [x] FSD folders, path alias `@/*`, React Query + Zustand + Zod + MSW installed
- [x] Bring MCPs (serena, context-mode, context7) + agents from bolao-copa
- [x] SPEC + PLAN + CLAUDE.md, git init

## Phase 1 — Domain & contracts (`entities/`, `shared/`)

- [ ] `entities/prediction` — Zod schemas + types: `Market` (`goal|card|corner|foul` with `provable` flag + key mapping), `Prediction`, `PredictionStatus`, multiplier/payout math (pure, unit-tested).
- [ ] `entities/match` — `MatchSnapshot`, `MatchEvent`, `Period`, `Pct`; period-key helper (`0/1000/3000/4000/5000/6000/7000`).
- [ ] `entities/wallet` — `WalletAdapter` interface (connect/address/balance/signAndSend), `ChainKind` (`solana|evm`); **Phantom (Solana) primary, MetaMask (EVM) secondary** adapters behind the interface. Mock adapter for demo; real adapters are drop-in.
- [ ] `shared/lib/format` — SOL/short-address/tx-hash/duration formatters.
- [ ] `shared/api` — typed client (fetch + Zod parse) for every endpoint; single place the network lives → the MSW↔real swap point.

## Phase 2 — On-chain settlement seam + match engine (`mocks/`)

- [ ] `mocks/match-engine` — deterministic timeline: scripted events (goals/cards/corners/fouls) at match-minutes + `Pct` curve, derived from match start × time-compression (~30×). Reproducible → settlement is always computable.
- [ ] `mocks/onchain` — simulate the Solana program: commit returns `{txHash, stampedAt, seq, epochDay}` (seq starts at 1; epochDay from the stamp `ts`, **not** Date.now — mirrors the real constraint); settle runs the geometric "who called it first" predicate against the timeline and returns `{result, proofId, payoutSol, calledSecondsBefore}`.
- [ ] `mocks/handlers` + `mocks/browser` — MSW REST handlers for all `/api/*`; `startMockServer()`.
- [ ] Settlement/predicate logic as a **pure module** shared by the mock and the future CPI path, unit-tested.

## Phase 3 — Session state & features (`store/`, `features/`)

- [ ] `store` — zustand session: wallet, balance, streak, current prediction, history (persisted to localStorage).
- [ ] `features/connect-wallet` — Phantom / guest; adapter-driven.
- [ ] `features/make-prediction` — commit flow: optimistic stamp, React Query mutation, streak/balance update.
- [ ] `features/resolve-prediction` — poll status, settle, win/lose transition, streak math.
- [ ] `features/copy-calls` — profile toggle (mocked follow).

## Phase 4 — Widgets (`widgets/`)

- [ ] `match-header`, `event-ticker`, `pct-meter` (live win-probability from real market `Pct`), `streak-banner`, `prediction-board` (market chips + live multipliers), `stake-selector`, `onchain-seal` (stamp animation), `countdown-ring`, `bottom-nav`. Perf: memoized, no layout thrash on feed tick.

## Phase 5 — Screens (`pages/`)

- [ ] Get Started (onboarding) · Live Match (hero) · Prediction Committed (stamp) · Result (win/lose) · Provable Track Record (profile) · Global Leaderboard · History.
- [ ] Router + bottom-nav wiring, route guards (needs wallet/guest).

## Phase 6 — Verify

- [ ] `pnpm type-check` + `pnpm build` clean.
- [ ] Unit tests: payout/multiplier/settlement predicate.
- [ ] Manual drive of the full loop in the browser (feed ticks, stamp, win + lose, streak, history, leaderboard).
- [ ] Lighthouse PWA pass; 375/768/1280 responsive; 60fps feed.

---

## Web3 architecture principles (non-negotiable)

- **Real domain, mocked network.** Transaction building, PDA/seq/epochDay handling, wallet signing, settlement predicate are production-shaped. Only the RPC/feed responses are MSW.
- **One network seam.** All I/O in `shared/api` + `mocks`. Zero fetch calls scattered in components.
- **Chain-agnostic wallet.** `WalletAdapter` interface → Phantom (Solana) now, MetaMask (EVM) ready, no UI rewrite.
- **Performance.** Feed polling via React Query with structural sharing; zustand selectors; memoized widgets; code-split routes; no re-render storms on each match tick.
- **Respect the 5 TxLINE traps** (SL12 not SL1, record feed early, no hardcoded markets, seq≥1 + epochDay-from-proof, no mainnet/devnet mixing) — see SPEC §7.

# Called It — Product & Technical Spec

> Live, on-chain-verified match prediction game for the FIFA World Cup 2026.
> Submission target: **Superteam × TxODDS World Cup Hackathon — Track 2: Consumer & Fan Experiences** (same build also fits Track 1: Prediction Markets). Deadline: **2026-07-19**.

---

## 1. The wedge (why this wins)

Every other fan app is a live scoreboard + reactions — all of which work **without** a blockchain, so they never prove the stack. Called It makes the **tamper-evident on-chain timestamp the product**:

> You commit a prediction **before** the event happens. The commitment is stamped on-chain the instant you tap. When the event resolves via the TxLINE feed (itself timestamped on Solana), settlement compares the two timestamps and **proves you called it first**. Nobody can fake a past prediction — the stamp doesn't lie.

This is the one design where removing the on-chain layer breaks the product. That's what "everything used correctly" means for the judges.

---

## 2. Provability model (the hard constraint)

TxLINE delivers **two very different layers**. Confusing them is what kills projects on demo day.

| Layer | Content | Settleable on-chain? |
| --- | --- | --- |
| **Rich (feed)** | goal author, minute, VAR, foul type, shot, substitution, lineups, `Pct` win-probability | ❌ No Merkle proof — **UI / narration only** |
| **Provable (Merkle)** | 8 statistics only: goals, yellow cards, red cards, corners — **per team, per period** | ✅ Proven by `validate_stat_v2` |

**The 8 provable keys** (period prefix: `0` total · `1000` 1st half · `3000` 2nd half · `4000/5000` extra time · `6000` penalty shootout · `7000` extra-time total):

| Key | Stat |
| --- | --- |
| 1 / 2 | Goals — team 1 / team 2 |
| 3 / 4 | Yellow cards |
| 5 / 6 | Red cards |
| 7 / 8 | Corners |

**Golden rule: prove the result, narrate the rest.** Anything involving money/points settles against the 8 keys. Anything using minute/player/possession is UI only.

### Market → provability mapping (used by the app)

| UI market (design) | Backed by | On-chain provable? |
| --- | --- | --- |
| **Goal** | keys 1/2 | ✅ |
| **Card** | keys 3–6 | ✅ |
| **Corner** | keys 7/8 | ✅ |
| **Foul** | rich feed only | ❌ — mocked in MSW, flagged `provable: false`; in production it stays a for-fun (points-only, no-settlement) market |

The prediction type carries a `provable` flag so the real-integration layer knows which ones route to a Solana CPI and which stay off-chain fun.

---

## 3. Core loop (one feature, done well)

1. **Watch** — a live match plays (clock, score, event ticker, live `Pct` win-probability, per-market multipliers).
2. **Call it** — tap a market chip (Corner / Card / Goal / Foul), pick a stake, hit **CALL IT**.
3. **Stamp** — the commitment is stamped on-chain: tx hash, on-chain timestamp, `seq`, `epochDay`. A resolving countdown runs.
4. **Resolve** — when the predicted event does / doesn't occur inside the window, settlement returns win/lose, a proof id, payout, and `calledSecondsBefore`.
5. **Streak** — consecutive wins raise a multiplier (3→1.5×, 5→2×…); a loss resets it.
6. **Record** — every call is appended to an unforgeable history that drives accuracy, rank, and the leaderboard.

Skill, not luck: who reads the game better earns more. No rigged RNG (the anti-`tigrinho` framing).

---

## 4. Screens (from the approved Stitch design)

1. **Get Started** — logo, "Prove you called it first", Connect Phantom / Play as guest, "Secured by Solana".
2. **Live Match (home / hero)** — match header (flags, score, minute, LIVE), event ticker, streak banner, prediction board (4 market chips w/ live multipliers), stake selector (1/5/10/MAX), CALL IT, bottom nav.
3. **Prediction Committed (stamp)** — on-chain seal animation, "Stamped on-chain · HH:MM:SS", tx hash, predicted market, stake, potential payout, resolving countdown ring, View my position.
4. **Result** — win ("CALLED IT!", payout count-up, streak, "you called it N seconds before it happened", proof id, Share proof) **and** lose ("Not this time", calm, streak reset).
5. **Provable Track Record (profile)** — avatar, accuracy %, calls count, rank, best streak, Copy-my-calls toggle, "Unforgeable · verified immutable on-chain data", call history list.
6. **Global Leaderboard** — ranked predictors by provable accuracy / streak, you highlighted.
7. **History** — full paginated list of your calls with on-chain markers.

Bottom nav: **Home · History · Profile**.

---

## 5. Data contracts (mocked by MSW, shaped like the real thing)

All money/currency in **SOL** (per design). Endpoints are versioned under `/api`.

- `POST /api/wallet/connect` → `{ address, balanceSol, provider }` — mock Phantom.
- `GET  /api/feed/:matchId` → live snapshot: `{ matchId, clockMin, period, home, away, score, pct, events[], markets[] }` (derived deterministically from match start + seed).
- `POST /api/predictions` → commit: body `{ matchId, market, stakeSol, atClockMin }` → `{ id, txHash, stampedAt, epochDay, seq, market, stakeSol, multiplier, potentialSol, windowMin, status: "resolving" }`.
- `GET  /api/predictions/:id` → poll: same shape; once resolved `{ status: "won"|"lost", proofId, payoutSol, calledSecondsBefore, resolvedEvent }`.
- `GET  /api/me` → `{ address, accuracy, totalCalls, bestStreak, rank, currentStreak, balanceSol }`.
- `GET  /api/leaderboard` → `{ entries: [{ rank, handle, accuracy, streak, calls, you? }] }`.

Prediction resolution is **deterministic**: MSW owns the match timeline (scripted event schedule + `Pct` curve derived from elapsed real time × compression). Settlement compares the committed `atClockMin` + window against the scheduled events, so the demo is reproducible and the "who called it first" claim is always computable.

---

## 6. MSW mock architecture

Two simulated systems, mapped 1:1 to what they become in production:

| Mock (now) | Production (later, docs pending) |
| --- | --- |
| **Match engine** — deterministic timeline in MSW, served via `GET /api/feed` | **TxLINE feed** — real SSE stream, Service Level **12** (not 1 — SL1 is 60 s late) |
| **On-chain sim** — `POST /api/predictions` stamps a fake tx/seq/epochDay; settle returns a fake proof | **Solana program** `validate_stat_v2` CPI — real Merkle settlement, geometric predicate |

Time is **compressed** (configurable, default ~30×) so a full match plays in ~3 min for the demo.

---

## 7. Real-integration notes (respect these when docs arrive)

Program IDs — mainnet `9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA` · devnet `6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J`. IDL `txoracle` v1.5.5/1.5.6. OpenAPI: `txline.txodds.com/docs/docs.yaml`.

The five traps (must not be violated in production):
1. **Service Level 1 is 60 s delayed** — subscribe to **SL 12** for real-time.
2. **History covers only ~2 weeks and not the last 6 h** — record the feed to disk from day one.
3. **No market catalog** — never hardcode that a market exists; discover from the payload at runtime.
4. **`seq` starts at 1** (seq=0 fails) and **`epochDay` must come from the proof's `ts`**, never `Date.now()`.
5. **Mainnet and devnet don't mix** — signature tx, JWT, activation host, program ID all on one network, or 403.

The prize feature to prove first: a real **CPI** into `validate_stat_v2` that releases the pot on the returned boolean (no public example exists — that's the strongest possible demo).

---

## 8. Architecture (Feature-Sliced Design)

```
src/
├── app/        ← router, providers
├── pages/      ← route screens (onboarding, live-match, history, profile, leaderboard)
├── widgets/    ← composed UI (match-header, event-ticker, prediction-board, streak-banner, bottom-nav, onchain-seal)
├── features/   ← use-cases (connect-wallet, make-prediction, resolve-prediction, copy-calls)
├── entities/   ← domain models (match, prediction, wallet) — types, schemas, market defs
├── shared/     ← ui (shadcn), lib (utils, format), api (typed client)
├── store/      ← zustand (session: wallet, streak, predictions)
└── mocks/      ← MSW handlers + deterministic match engine
```

Import rule: only from layers below (`app → pages → widgets → features → entities → shared`). Zod validates every API boundary. React Query owns server state (feed polling, prediction status); zustand owns session/UI state.

## 9. Out of scope (this pass)

Real Phantom/Solana wallet, real TxLINE feed, real Anchor program & CPI, deposits/withdrawals with real value, KYC. All stubbed by MSW; swap-in points are isolated in `shared/api` + `mocks`.

## 10. Non-negotiables

- UI 100% **English**.
- Mobile-first PWA, one-handed, phone-shaped canvas.
- No `any` (use `unknown` + narrowing); named prop interfaces; semantic names.
- Comment only non-obvious "why". Readable in ≤10s.
- Micro-commits, English imperative messages, **zero LLM traces** (no `Co-Authored-By`, no bot mentions).

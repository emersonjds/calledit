# BACKEND.md — Called It backend work plan

> The backend that replaces MSW at the network boundary and delivers the prize feature: a **real CPI
> settlement** into the `txoracle` program. Read [`txline-integration.md`](./txline-integration.md)
> first. Frontend contracts are owned by `src/shared/api/client.ts` + `src/shared/api/schemas.ts` — the
> backend must satisfy exactly those shapes. Do not change `src/`, `SPEC.md`, `PLAN.md`, or `README.md`.

---

## 1. What the frontend already assumes

The typed client (`src/shared/api/client.ts`) calls six seams, Zod-validated against
`schemas.ts`. MSW mocks them today; the real backend must serve the **same shapes**:

| Frontend call | Method + path | Zod shape it must return |
| --- | --- | --- |
| `connectWallet` | `POST /api/wallet/connect` | `WalletAccount { address, balanceSol, chain, provider }` |
| `getFeed` | `GET /api/feed/:matchId` | `MatchSnapshot { matchId, clockMin, period, home, away, score:[n,n], pct{home,draw,away}, events[], markets[], live }` |
| `commitPrediction` | `POST /api/predictions` | `Prediction { id, matchId, market, provable, stakeSol, multiplier, potentialSol, atClockMin, windowMin, status, stamp{txHash,stampedAt,seq,epochDay}, settlement? }` |
| `getPrediction` | `GET /api/predictions/:id` | same `Prediction` (poll until `status` = `won`/`lost` with `settlement`) |
| `getProfile` | `GET /api/me?address=` | `ProfileDto { address, handle, accuracy, totalCalls, wonCalls, bestStreak, currentStreak, rank, balanceSol }` |
| `getLeaderboard` | `GET /api/leaderboard?address=` | `LeaderboardDto { entries[{rank,handle,accuracy,streak,calls,you}] }` |

Hard constraints baked into the schemas: `stamp.seq >= 1` (int), `epochDay` int, `provable`
gates settlement. The backend must **honor** them — they mirror TxLINE traps #4 and the provability model.

---

## 2. Backend components to build

### (a) Wallet + subscription bootstrap
One-time (per network) setup that gets the service running.
- Get/hold a service wallet with **SOL** (devnet: airdrop; mainnet: fund).
- `subscribe(SL 12, 4 weeks)` on-chain via `txoracle` (Token-2022 ATAs, PDAs `token_treasury_v2` /
  `pricing_matrix`).
- Sign the activation message, `POST /api/token/activate`, store `{ jwt, apiToken, network }`.
- Serves `POST /api/wallet/connect` for the user's own wallet connect (Phantom pubkey + SOL balance
  from RPC).

### (b) TxLINE feed ingester / recorder  — **respects trap #2, build TODAY**
- Open **SSE** to `/scores/stream` and `/odds/stream` (both auth headers, Node 20+).
- **Persist every raw event to disk** append-only (jsonl/db), keyed by `fixtureId` + `seq` + `ts`.
  History endpoints are too short to reconstruct later — the recorder is the system of record.
- Auto-reconnect; on 401 renew JWT and resume.

### (c) Match-state projector
- Fold recorded score events into the app's `MatchSnapshot`: `clockMin`, `period`, `score`,
  `events[]` (map `SoccerData` action/goal/card/corner → `MatchEvent`), `pct` from the odds `Pct`
  array (house margin already removed), `markets[]` **discovered from the payload** (no hardcoded
  catalog — trap #3), `live`.
- Serves `GET /api/feed/:matchId`.

### (d) Settlement service — **the prize feature**
- On prediction resolution: `GET /api/scores/stat-validation-v3?fixtureId=&seq=&statKeys=` using the
  provable keys for the market × period (`periodKey(period, baseKey)` from `entities/match/periods.ts`).
- Submit a **real CPI** into `txoracle` `validate_stat` (verify the exact instruction from the IDL) —
  re-hash the multiproof to the on-chain batch root, get the boolean, **release the pot on-chain**.
  No public example does this; it is the strongest demo (ideas doc §3B, §6 day 1).
- Derive `epochDay` from the proof `ts`, `seq` from the event — never `Date.now()` (trap #4).
- Route **only `provable` markets** here; `foul` stays points-only.
- Serves `GET /api/predictions/:id` (returns `settlement` once resolved) and backs `POST /api/predictions`.

### (e) Escrow / pot mechanism
- Hold stakes and pay winners from the `validate_stat` boolean.
- **Regulatory caveat (flag to Emerson):** real-money escrow needs licensing. For the hackathon ship
  **free-to-play / points, or a sponsor/points pool** (ideas doc: cards & corners free-to-play sidesteps
  regulation entirely). Real-money is post-hackathon and out of scope.

### (f) Credential lifecycle / refresh
- 401 → renew JWT (same host), retry with same API token. 403 → assert message/wallet/signature/network/host.
- Never log or commit JWT/apiToken/keys.

---

## 3. Day-by-day plan (mirrors the ideas doc "order of attack")

| When | Deliver |
| --- | --- |
| **TODAY (non-negotiable)** | Service wallet + SOL → `subscribe` **SL 12** → activate token → **feed recorder running to disk**. Nothing else starts until this runs. |
| **Day 1** | **De-risk the CPI before building on it:** a minimal Anchor call that does a real CPI into `txoracle` `validate_stat` and reads the returned boolean. If it works, the project stands. If not, discover it now, not on day 6. |
| **Days 2–3** | Pot contract: deposit → predict → **settlement via CPI** → payout. One match, one pot, no frills. |
| **Days 4–5** | Wire the real backend behind the six frontend seams (swap MSW). Match-state projector + prediction/settlement endpoints. |
| **Day 6** | Run against a **real live match** with real people. Find what breaks. |
| **Day 7** | Demo video (eliminatory requirement). Reserve the whole day. |

**The two things that are TODAY:** the feed recorder must be running (live matches vanish with the
World Cup) and the CPI must be proven on day 1. Everything else can slip; these can't.

---

## 4. Task checklist

- [ ] Service wallet created per network; SOL funded (devnet airdrop first).
- [ ] `subscribe(12, 4)` confirmed on-chain; `txSig` stored.
- [ ] Activation message signed by the **subscribing** wallet; `apiToken` obtained + stored.
- [ ] `program.programId.equals(configuredProgramId)` assertion in place.
- [ ] SSE recorder for `/scores/stream` + `/odds/stream` persisting raw events to disk.
- [ ] Reconnect + 401-renew loop.
- [ ] Match-state projector → `MatchSnapshot` (markets discovered from payload).
- [ ] `stat-validation-v3` proof fetch wired to `periodKey(period, baseKey)`.
- [ ] **Real CPI** into `txoracle` `validate_stat` (instruction confirmed from IDL).
- [ ] Pot/escrow (points/free-to-play for hackathon) with payout on boolean.
- [ ] Six frontend seams served with the exact Zod shapes.
- [ ] No secrets in git; `.env` ignored.

## 5. Env / secrets

```
NETWORK=mainnet|devnet
SOLANA_RPC_URL=
TXLINE_API_ORIGIN=            # https://txline.txodds.com | https://txline-dev.txodds.com
TXORACLE_PROGRAM_ID=
TXL_TOKEN_MINT=
SERVICE_WALLET_SECRET=        # keypair — never commit
TXLINE_JWT=                   # cached, refreshed on 401
TXLINE_API_TOKEN=            # from /api/token/activate
```

## 6. Libraries

`@coral-xyz/anchor` · `@solana/web3.js` · `@solana/spl-token` (TOKEN_2022) · `tweetnacl` · `axios` ·
an SSE client (Node 20+). IDL `txoracle.json` + `Txoracle` type per network.

## 7. Risks

- **CPI has no public example** — de-risk day 1; fallback is `.view()` simulation + signed settlement
  (works, less impressive).
- **Devnet vs mainnet** — one network per credential set; real-time World Cup only on mainnet SL 12.
- **Regulatory** — real-money escrow needs licensing; ship free-to-play/points for the hackathon.
- **History window** — if the recorder isn't running before matches, that data is gone.

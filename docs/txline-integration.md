# TxLINE Integration Reference

> Developer reference for integrating the **TxODDS TxLINE** hybrid on-chain/off-chain data feed
> (OpenAPI **1.5.6**, IDL `txoracle`) into **Called It**. Everything here is verified against the
> official quickstart, World Cup free-tier guide, and `openapi.raw`. Do not invent endpoints or fields.

---

## 0. Mental model

TxLINE is **two systems glued by cryptography**:

1. **Off-chain REST/SSE API** (`{host}/api/...`) — serves fixtures, odds, scores, and Merkle proofs.
   Gated by two credentials (a guest JWT + an activated API token).
2. **On-chain Solana program** (`txoracle`) — publishes the Merkle **batch root**, holds the
   subscription state, and exposes a `validate_stat` instruction family that lets *anyone* prove,
   on-chain, that a statistic held — using the proof the REST API returns.

The provable surface is **8 numbers only** (goals / yellow / red / corners, per team, per period).
Everything else the feed carries (goal author, minute, VAR, possession, fouls) is **narration** — it
has no Merkle proof and can never settle on-chain.

---

## 1. Networks — pick ONE and never cross it

Every step (RPC, program ID, TxL mint, guest-JWT host, activation host) must be on the **same
network**, or you get an unexplained **403**. This is trap #5.

| | Mainnet | Devnet |
| --- | --- | --- |
| Program ID | `9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA` | `6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J` |
| TxL mint | `Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL` | `4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG` |
| API host | `https://txline.txodds.com` | `https://txline-dev.txodds.com` |
| Solana RPC | `https://api.mainnet-beta.solana.com` | `https://api.devnet.solana.com` |
| Free service levels | `1` (60s delay) · **`12` (real-time)** | `1` (samplingIntervalSec=0, per on-chain pricing matrix) |

**Real-time World Cup data only exists on mainnet SL 12.** Devnet is for proving the on-chain path
cheaply (airdroppable SOL); mainnet SL 12 is for the live demo feed. Load the **matching**
`txoracle.json` IDL / `Txoracle` type per network and assert
`program.programId.equals(configuredProgramId)` before doing anything.

---

## 2. Credential lifecycle

```
POST /auth/guest/start ─► guest JWT
        │
        ▼
on-chain: program.methods.subscribe(SL, weeks)  ─► txSig   (needs SOL for fees/rent)
        │
        ▼
sign message `${txSig}:${leagues.join(",")}:${jwt}`  with wallet.signMessage → base64
        │
        ▼
POST /api/token/activate {txSig, walletSignature, leagues}  (Authorization: Bearer jwt) ─► apiToken
        │
        ▼
every data request sends BOTH:  Authorization: Bearer ${jwt}   +   X-Api-Token: ${apiToken}
```

### 2.1 Guest JWT
`POST {host}/auth/guest/start` → `TokenResponse { token }`. Read it as `response.data.token`.
Sent as `Authorization: Bearer <jwt>` **and** embedded in the activation signature preimage.

### 2.2 Subscribe on-chain (`txoracle` Anchor program)
Free World Cup tiers require **no TxL**, but the subscribe tx still needs **SOL** for fees + rent
(on devnet, airdrop first). Derive shared PDAs once:

```ts
const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_treasury_v2")], program.programId);
const [pricingMatrixPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("pricing_matrix")], program.programId);

const tokenTreasuryVault = getAssociatedTokenAddressSync(
  txlTokenMint, tokenTreasuryPda, true, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
const userTokenAccount = getAssociatedTokenAddressSync(
  txlTokenMint, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

const SERVICE_LEVEL_ID = 12;      // mainnet real-time; SL 1 is 60s late
const DURATION_WEEKS = 4;         // multiples of 4, up to 12 months, free to renew
const SELECTED_LEAGUES: number[] = [];  // [] = standard World Cup bundle

const txSig = await program.methods
  .subscribe(SERVICE_LEVEL_ID, DURATION_WEEKS)
  .accounts({
    user: wallet.publicKey,
    pricingMatrix: pricingMatrixPda,
    tokenMint: txlTokenMint,
    userTokenAccount,
    tokenTreasuryVault,
    tokenTreasuryPda,
    tokenProgram: TOKEN_2022_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

> **TOKEN_2022, not the classic token program.** The TxL mint is a Token-2022 mint; use
> `TOKEN_2022_PROGRAM_ID` for every ATA derivation and for the `tokenProgram` account.

### 2.3 Activate the API token
Sign the **exact** message string with the **same wallet** that submitted the subscribe tx:

```ts
const messageString = `${txSig}:${SELECTED_LEAGUES.join(",")}:${jwt}`;
// SELECTED_LEAGUES = []  →  `${txSig}::${jwt}`  (two colons)
const signatureBytes = await wallet.signMessage(new TextEncoder().encode(messageString));
const walletSignature = Buffer.from(signatureBytes).toString("base64");  // base64 detached

const { data } = await axios.post(`${host}/api/token/activate`,
  { txSig, walletSignature, leagues: SELECTED_LEAGUES },
  { headers: { Authorization: `Bearer ${jwt}` } });
const apiToken = data.token || data;
```

`ActivationPayload` required fields: `txSig`, `walletSignature` (+ optional `leagues: int32[]`).

### 2.4 Refresh rules
- **401** on a data request → guest JWT expired. Renew via `/auth/guest/start` on the **same host**;
  retry with the **same** API token.
- **403** on activation or data → check message string, signing wallet, base64 encoding, tx network,
  and activation host all match one network.

### 2.5 Optional: buy TxL (paid tiers only — not needed for World Cup)
`POST /api/guest/purchase/quote { buyerPubkey, txlineAmount }` (Bearer JWT) →
`PurchaseQuoteResponse { transactionBase64, baseUsdtCost, feeUsdtAmount, totalUsdtCharged }`.
Deserialize, sign locally, broadcast. Requires USDT; TxODDS may require KYC. **Skip for Called It.**

---

## 3. Data endpoints

All under `{host}/api`, all require **both** headers (`Authorization: Bearer <jwt>`,
`X-Api-Token: <apiToken>`). `epochDay`/`hourOfDay`/`interval` come from the API/proofs, never
`Date.now()` (trap #4).

### Fixtures
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/fixtures/snapshot` | Latest fixture metadata (optionally from/within a window) |
| GET | `/fixtures/updates/{epochDay}/{hourOfDay}` | Fixture updates for a day/hour |
| GET | `/fixtures/validation` | Merkle proof for one fixture update |
| GET | `/fixtures/batch-validation` | Merkle proof for a full hourly fixture batch |

`Fixture` fields include `FixtureId (int64)`, `StartTime/Ts (int64)`, `Competition(Id)`,
`Participant1/2(Id)`, `Participant1IsHome`.

### Odds (StablePrice)
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/odds/snapshot/{fixtureId}` | Latest odds per unique market line |
| GET | `/odds/updates/{fixtureId}` | Live odds updates for a fixture |
| GET | `/odds/updates/{epochDay}/{hourOfDay}/{interval}` | Historical 5-min bucket |
| GET | `/odds/stream` | **SSE** real-time odds stream |
| GET | `/odds/validation` | Merkle proof for one odds update |

`OddsPayload` carries a **clean `Pct` array** (win-probability with the house margin already removed) —
this powers the app's live win-probability meter. Also `PriceNames[]`, `Prices[]`, `MarketPeriod`,
`MarketParameters`, `InRunning`, `GameState`. **There is no market catalog — discover markets from the
payload at runtime** (trap #3).

### Scores
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/scores/snapshot/{fixtureId}` | Latest score events for a fixture |
| GET | `/scores/updates/{fixtureId}` | Score updates in the current window |
| GET | `/scores/updates/{epochDay}/{hourOfDay}/{interval}` | Historical 5-min bucket |
| GET | `/scores/historical/{fixtureId}` | Full stored sequence (limited window) |
| GET | `/scores/stream` | **SSE** live match feed |
| GET | `/scores/stat-validation` | Merkle proof (v1) |
| GET | `/scores/stat-validation-v3` | **Merkle multiproof — the settlement endpoint** |

> **Trap #2 — history is short** (roughly ~2 weeks, and not the most recent hours). Never rely on
> `/scores/historical` for anything you'll need later. **Record the SSE stream to disk from day one.**

A `Scores` event is large. The fields Called It uses: `fixtureId`, `seq (int32)`, `ts (int64)`,
`gameState`, `action`, `scoreSoccer`, and `stats` (the per-event `ScoreStat` list). `SoccerScore`
(cumulative) = `{ Goals, YellowCards, RedCards, Corners }`. `SoccerTotalScore` splits by period
(`H1, HT, H2, ET1, ET2, PE, ETTotal, Total`).

---

## 4. Settlement — the crux

### 4.1 The 8 provable keys × periods
Only these settle on-chain. Base key + period prefix = the stat leaf key.

| Base key | Stat (team 1 / team 2) |
| --- | --- |
| 1 / 2 | Goals |
| 3 / 4 | Yellow cards |
| 5 / 6 | Red cards |
| 7 / 8 | Corners |

| Prefix | Period |
| --- | --- |
| `0` | Total (full match) |
| `1000` | 1st half |
| `3000` | 2nd half |
| `4000` / `5000` | Extra time (ET1 / ET2) |
| `6000` | Penalty shootout |
| `7000` | Extra-time total |

Settlement key = `prefix + baseKey` (e.g. a 1st-half team-1 goal is `1001`). This mapping is already
encoded in `src/entities/match/periods.ts` and `src/entities/prediction/markets.ts`. Anything using
minute/author/possession is **not provable** — the `foul` market is `provable: false` and never routes
to settlement.

### 4.2 Get the proof: `GET /api/scores/stat-validation-v3`
Query params (both auth headers required):

| Param | Type | Notes |
| --- | --- | --- |
| `fixtureId` | int32 | the fixture |
| `seq` | int32 | sequence number of the specific score event within the fixture's history — **from the feed/proof, starts at 1, never `Date.now()`** |
| `statKeys` | string | comma-separated **1 to 5** stat keys |

Returns **`ScoresStatValidationV3`** — a three-level Merkle bundle:

```
ScoresStatValidationV3 {
  ts: int64                       // event timestamp — derive epochDay from THIS, not the clock
  summary: ScoresBatchSummary     // { fixtureId, updateStats, eventStatsSubTreeRoot: binary }
  eventStatRoot: binary           // root of the individual-stats sub-tree for this event
  statsToProve: StatLeaf[]        // StatLeaf { stat: ScoreStat, statProof }
  multiproof: Multiproof          // { hashes, indices[] }  — compressed multiproof over the stats
  subTreeProof: List_ProofNode    // event → fixture summary
  mainTreeProof: List_ProofNode   // fixture summary → on-chain batch root
}
ScoreStat  { key: int32, value: int32, period: int32 }
ProofNode  { hash: binary, isRightSibling: bool }   // List_ProofNode = { items: ProofNode[] }
```

**Three levels:** individual stats → score-update event (`eventStatRoot`) → fixture summary
(`eventStatsSubTreeRoot`, via `subTreeProof`) → main batch root published on-chain (via `mainTreeProof`).
`stat-validation` (v1) and the `ScoresStatValidationV2` schema also exist; **v3 is the current
authoritative multiproof endpoint** — prefer it (up to 5 keys in one proof).

### 4.3 Execute on-chain: `txoracle` `validate_stat` instruction
With the returned proof, submit a Solana transaction into the `txoracle` program's `validate_stat`
instruction family (the ideas doc references `validate_stat_v2`) to prove a **strategy** holds against
the extracted stats — e.g. *team-1 goals ≥ threshold*, or a *binary/difference condition between two
stats*. The instruction re-hashes the leaves with the multiproof up to the on-chain batch root and
returns a boolean.

> **The exact instruction name, args, and account list must be read from the network's
> `txoracle.json` IDL** (typed `Program<Txoracle>`) — the IDL is the authority, not this doc. The
> official examples only ever run it via `.view()` simulation; **no public example performs a real CPI**
> that releases value on the boolean. That real CPI is Called It's prize feature (see BACKEND.md).

---

## 5. The 5 traps (do not violate)

1. **SL 1 is 60s late** → subscribe **SL 12** (mainnet real-time).
2. **Score history is short** (~2 weeks, misses recent hours) → **record `/scores/stream` +
   `/odds/stream` to disk from day one.**
3. **No market catalog** → never hardcode that a market exists; discover from the payload.
4. **`seq` ≥ 1 (seq=0 rejected) and `epochDay` derives from the proof `ts`**, never `Date.now()`.
5. **Mainnet ≠ devnet** — RPC, program ID, TxL mint, JWT host, activation host all one network, or 403.

---

## 6. Libraries & runtime

```
@coral-xyz/anchor  @solana/web3.js  @solana/spl-token (TOKEN_2022)  tweetnacl  axios
```
SSE examples require **Node 20+**. IDL/types (`txoracle.json`, `Txoracle`) must match the chosen network.

---

## 7. HTTP error map

| Status | Meaning | Action |
| --- | --- | --- |
| 400 | Bad param (Authorization / X-Api-Token / fixtureId / seq / statKeys) | Fix the request |
| 401 | Invalid/expired guest JWT | Renew JWT on same host, retry with same API token |
| 403 | Invalid API token or network mismatch | Check message/wallet/signature/network/host |
| 500 | Server error | Retry with backoff |

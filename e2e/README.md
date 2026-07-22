# E2E evidence & demo reel

Playwright drives the app in **demo mode** (MSW, no real funds) to capture PNG evidence of
every screen and the core "call it" mechanic, then ffmpeg stitches the ordered PNGs into
`.github/demo.gif` — the reel shown in the root README. Screens stay in the gitignored
`media/` folder; only the gif is committed.

## Flow captured (`demo.spec.ts`)

Demo mode auto-connects a guest wallet via `/onboarding?demo=1`, so no wallet extension is needed.
The session is in-memory, so each screen is reached through in-app navigation — never a reload.

| #   | Screen               | What it proves                                            |
| --- | -------------------- | --------------------------------------------------------- |
| 01  | Onboarding           | Entry point, "Prove you called it first"                  |
| 02  | Live match           | Match header, live odds, prediction board, stake selector |
| 03  | Market selected      | Tap a provable market → CALL IT arms                      |
| 04  | Confirm call         | Stake + market confirmation dialog                        |
| 05  | Prediction committed | On-chain stamp, seq, resolving countdown                  |
| 06  | Wallet               | Balance, address                                          |
| 07  | History              | Past calls                                                |
| 08  | Profile              | Streak, stats                                             |
| 09  | Leaderboard          | Ranking                                                   |

Viewport is mobile-first (390×844, DPR 2) to match the PWA.

## Run

```bash
pnpm e2e          # run suite, write PNGs to media/screens/
pnpm e2e:video    # stitch PNGs → .github/demo.gif (needs ffmpeg)
```

`pnpm e2e` builds and serves a production preview itself (Playwright `webServer`) in forced-demo
mode — the production build avoids the StrictMode double-mount that drops the guest-connect redirect.

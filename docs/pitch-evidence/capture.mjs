/**
 * Called It — pitch-evidence capture (E2E screen-flow walk in DEMO mode).
 *
 * Walks the app through its full user flow on a mobile viewport (iPhone 13) and writes
 * one screenshot per screen to docs/pitch-evidence/NN-name.png.
 *
 * Prereqs:
 *   1. Dev server in demo mode:   VITE_FORCE_DEMO=true pnpm dev     (note the port)
 *   2. Playwright + chromium:     npm i playwright && npx playwright install chromium
 *   3. Run:                       BASE=http://localhost:5173 node docs/pitch-evidence/capture.mjs
 *
 * NOTE: as shipped, the "CALL IT" step signs a REAL devnet transfer via @solana/web3.js +
 * a real Phantom extension, which (a) needs a Buffer polyfill Vite doesn't provide and
 * (b) never runs standalone. To capture the commit/settlement overlays this run used two
 * temporary local patches (see the report): a Buffer polyfill and a demo-mode short-circuit
 * in signStakeTransfer. With those in place the flow below runs entirely on MSW mocks.
 */
import { chromium, devices } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:5173';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const iphone = devices['iPhone 13'];

const shot = async (page, name, opts = {}) => {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), ...opts });
  console.log('  saved', name);
};

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...iphone });
  await ctx.addInitScript(() => {
    // Force demo mode from the first load so MSW mocks the whole backend.
    try {
      localStorage.setItem('called-it:mode', 'demo');
    } catch {}
  });
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept()); // the "Sign a real devnet stake?" confirm

  // ---------- 01 onboarding ----------
  console.log('onboarding');
  await page.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Try the demo/i }).waitFor({ timeout: 10000 });
  await shot(page, '01-onboarding', { fullPage: true });

  // ---------- 02 connect-wallet modal ----------
  await page.getByRole('button', { name: /Log in or sign up/i }).click();
  await page.getByText(/Choose how you want to call it/i).waitFor({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '02-connect-wallet');
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);

  // ---------- enter the demo ----------
  await page.getByRole('button', { name: /Try the demo/i }).click();
  await page.getByText('CALL IT').waitFor({ timeout: 12000 });
  await page.waitForTimeout(1200);

  // NOTE: navigate client-side only — a full page reload (page.goto) drops the in-memory
  // session (zustand) and bounces back to /onboarding.

  // ---------- 03 wallet balance ----------
  console.log('wallet');
  await page.locator('a[href="/wallet"]').first().click();
  await page.getByText(/TOTAL BALANCE|ON-CHAIN BALANCE/i).waitFor({ timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '03-wallet-connected-balance', { fullPage: true });

  // ---------- 04 / 05 live match board (single live match — no multi-match list in this app) ----------
  console.log('live match');
  await page.getByRole('button', { name: /Go back/i }).click();
  await page.getByText('CALL IT').waitFor({ timeout: 8000 });
  await page.waitForTimeout(2500); // let live events tick in
  await shot(page, '04-live-matches-list', { fullPage: true });
  await page.waitForTimeout(2500);
  await shot(page, '05-match-live-board', { fullPage: true });

  // ---------- 06 select market + stake ----------
  await page.getByRole('button', { name: /Foul/i }).first().click().catch(() => {});
  await page.waitForTimeout(300);
  // Stake must be <= balance (4.2 SOL); quick-pick 1 keeps CALL IT enabled.
  await page.getByRole('button', { name: /^1$/ }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '06-select-market-stake', { fullPage: true });

  // ---------- 07 / 08 / 09 / 10 commit + settlement ----------
  console.log('commit + settlement');
  let gotStamping = false;
  let gotCommitted = false;
  let gotWin = false;
  let gotLose = false;

  const closeOverlay = async () => {
    await page
      .getByRole('button', { name: /Next prediction|Try again|Minimize/i })
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(800);
  };

  const markets = ['Foul', 'Corner', 'Goal', 'Card'];
  for (let attempt = 0; attempt < 10 && !(gotWin && gotLose); attempt++) {
    const market = markets[attempt % markets.length];
    await page.getByRole('button', { name: new RegExp(market, 'i') }).first().click().catch(() => {});
    await page.waitForTimeout(300);
    const call = page.getByRole('button', { name: /CALL IT/i });
    if (!(await call.isEnabled().catch(() => false))) {
      await page.waitForTimeout(1500); // match may be between live states
      continue;
    }
    await call.click();

    // 07 making-call — the brief "Stamping on-chain…" pending state.
    if (!gotStamping) {
      await page.waitForTimeout(120);
      if (await page.getByText(/Stamping on-chain/i).isVisible().catch(() => false)) {
        await shot(page, '07-making-call');
        gotStamping = true;
      }
    }

    // 08 prediction-committed — the on-chain seal / resolving overlay.
    await page.getByText(/Prediction Committed/i).waitFor({ timeout: 8000 }).catch(() => {});
    if (!gotCommitted && (await page.getByText(/Prediction Committed/i).isVisible().catch(() => false))) {
      await page.waitForTimeout(400);
      await shot(page, '08-prediction-committed');
      gotCommitted = true;
    }

    const settled = await Promise.race([
      page.getByText(/CALLED IT!/i).waitFor({ timeout: 30000 }).then(() => 'won').catch(() => null),
      page.getByText(/Not this time/i).waitFor({ timeout: 30000 }).then(() => 'lost').catch(() => null),
    ]);
    await page.waitForTimeout(500);
    if (settled === 'won' && !gotWin) {
      await shot(page, '09-settlement-win');
      gotWin = true;
    } else if (settled === 'lost' && !gotLose) {
      await shot(page, '10-settlement-lose');
      gotLose = true;
    }
    await closeOverlay();
  }
  console.log('  settlement results:', { gotStamping, gotCommitted, gotWin, gotLose });

  // ---------- 11 history (bottom nav) ----------
  console.log('history / profile / leaderboard');
  await page.locator('a[href="/history"]').first().click();
  await page.getByText(/Call History/i).waitFor({ timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '11-history', { fullPage: true });

  // ---------- 13 profile (bottom nav) ----------
  await page.locator('a[href="/profile"]').first().click();
  await page.getByText(/Your record/i).waitFor({ timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '13-profile', { fullPage: true });

  // ---------- 12 leaderboard (link from profile) ----------
  await page.locator('a[href="/leaderboard"]').first().click();
  await page.getByText(/Global Leaderboard/i).waitFor({ timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, '12-leaderboard', { fullPage: true });

  await ctx.close();

  // ---------- 20 on-chain proof (real devnet tx, Solana Explorer) ----------
  console.log('solana explorer');
  const ctx2 = await browser.newContext({ ...iphone });
  const page2 = await ctx2.newPage();
  const url =
    'https://explorer.solana.com/tx/3W3TskMpaw7ASk8WwFgfdgYTzR28cWrAmABdc2nYokaJy2qWgpPj1KduUYhXeT4y3xjDT4tPsx3fSBmcaKjkLbFj?cluster=devnet';
  await page2.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page2.getByText(/Overview|Transaction|Signature/i).first().waitFor({ timeout: 15000 }).catch(() => {});
  await page2.waitForTimeout(2500);
  await shot(page2, '20-onchain-tx', { fullPage: true });
  await ctx2.close();

  await browser.close();
  console.log('done');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

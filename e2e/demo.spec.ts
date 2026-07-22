import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SHOTS_DIR = join('media', 'screens');

let frameIndex = 0;
async function capture(page: Page, name: string) {
  frameIndex += 1;
  const file = join(SHOTS_DIR, `${String(frameIndex).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file });
}

test.beforeAll(() => mkdirSync(SHOTS_DIR, { recursive: true }));

test('demo reel: onboarding, call mechanic, and every screen', async ({ page }) => {
  await page.goto('/onboarding');
  await expect(page.getByText(/Prove you called/i)).toBeVisible();
  await capture(page, 'onboarding');

  // ?demo=1 assumes demo mode is already persisted — the "Try the demo" button sets it before redirecting.
  await page.evaluate(() => localStorage.setItem('called-it:mode', 'demo'));
  await page.goto('/onboarding?demo=1');
  const callButton = page.getByRole('button', { name: /CALL IT/i });
  await expect(callButton).toBeVisible({ timeout: 15_000 });
  await capture(page, 'live-match');

  await page
    .getByRole('button', { name: /Corner/i })
    .first()
    .click();
  await expect(callButton).toBeEnabled({ timeout: 15_000 });
  await capture(page, 'market-selected');

  await callButton.click();
  const confirmButton = page.getByRole('button', { name: /Call it/i });
  await expect(confirmButton).toBeVisible();
  await capture(page, 'confirm-call');

  await confirmButton.click();
  await expect(page.getByText(/Prediction Committed/i)).toBeVisible({ timeout: 15_000 });
  await capture(page, 'prediction-committed');
  await page.getByRole('button', { name: /Minimize/i }).click();

  // The session lives in memory, so reach every screen via in-app links — a full reload would drop it.
  await page.locator('a[href="/wallet"]').first().click();
  await page.waitForURL('**/wallet');
  await capture(page, 'wallet');

  await page.getByRole('link', { name: 'History' }).click();
  await page.waitForURL('**/history');
  await capture(page, 'history');

  await page.getByRole('link', { name: 'Profile' }).click();
  await page.waitForURL('**/profile');
  await capture(page, 'profile');

  await page.locator('a[href="/leaderboard"]').first().click();
  await page.waitForURL('**/leaderboard');
  await capture(page, 'leaderboard');
});

import { afterEach, describe, expect, it } from 'vitest';
import { detectWallets } from './adapters';

const globalWithWindow = globalThis as unknown as { window?: Record<string, unknown> };

afterEach(() => {
  delete globalWithWindow.window;
});

describe('detectWallets', () => {
  it('marks a wallet installed when its provider is injected', () => {
    globalWithWindow.window = { phantom: { solana: { isPhantom: true } } };
    const phantom = detectWallets().find((option) => option.id === 'phantom');
    expect(phantom?.installed).toBe(true);
    expect(phantom?.connect).toBeDefined();
  });

  it('marks all wallets not installed when nothing is injected', () => {
    globalWithWindow.window = {};
    const options = detectWallets();
    expect(options.every((option) => !option.installed)).toBe(true);
    expect(options.every((option) => option.connect === undefined)).toBe(true);
  });

  it('lists phantom, solflare, backpack and metamask', () => {
    globalWithWindow.window = {};
    expect(detectWallets().map((option) => option.id)).toEqual([
      'phantom',
      'solflare',
      'backpack',
      'metamask',
    ]);
  });
});

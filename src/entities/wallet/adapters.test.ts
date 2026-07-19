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

  it('lists phantom and metamask', () => {
    globalWithWindow.window = {};
    expect(detectWallets().map((option) => option.id)).toEqual(['phantom', 'metamask']);
  });

  it('falls back to window.solana when isPhantom is set there', () => {
    globalWithWindow.window = { solana: { isPhantom: true } };
    const phantom = detectWallets().find((option) => option.id === 'phantom');
    expect(phantom?.installed).toBe(true);
  });

  it('ignores window.solana from a non-Phantom provider', () => {
    globalWithWindow.window = { solana: { isPhantom: false } };
    const phantom = detectWallets().find((option) => option.id === 'phantom');
    expect(phantom?.installed).toBe(false);
  });

  it('picks MetaMask out of a multi-wallet providers array', () => {
    globalWithWindow.window = {
      ethereum: { providers: [{ isMetaMask: false }, { isMetaMask: true }] },
    };
    const metamask = detectWallets().find((option) => option.id === 'metamask');
    expect(metamask?.installed).toBe(true);
  });

  it('does not treat a non-MetaMask injected provider as MetaMask', () => {
    globalWithWindow.window = { ethereum: { isMetaMask: false } };
    const metamask = detectWallets().find((option) => option.id === 'metamask');
    expect(metamask?.installed).toBe(false);
  });
});

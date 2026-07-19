import { beforeEach, describe, expect, it } from 'vitest';
import {
  base58Encode,
  createEmbeddedWallet,
  hasEmbeddedWallet,
  loadEmbeddedWallet,
  saveEmbeddedWallet,
} from './solana-keypair';

describe('base58Encode', () => {
  it('encodes single bytes', () => {
    expect(base58Encode(new Uint8Array([0]))).toBe('1');
    expect(base58Encode(new Uint8Array([1]))).toBe('2');
  });
  it('preserves leading zero bytes as ones', () => {
    expect(base58Encode(new Uint8Array(32))).toBe('1'.repeat(32));
    const value = new Uint8Array(32);
    value[31] = 1;
    expect(base58Encode(value)).toBe('1'.repeat(31) + '2');
  });
});

describe('createEmbeddedWallet', () => {
  it('returns a valid solana address and a distinct secret each time', async () => {
    const wallet = await createEmbeddedWallet();
    expect(wallet.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    expect(wallet.secret.length).toBeGreaterThan(80);
    const other = await createEmbeddedWallet();
    expect(other.address).not.toBe(wallet.address);
  });
});

describe('embedded wallet storage', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    const shim: Storage = {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      removeItem: (key: string) => store.delete(key),
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    globalThis.localStorage = shim;
  });

  it('round-trips a saved wallet', () => {
    expect(hasEmbeddedWallet()).toBe(false);
    saveEmbeddedWallet({ address: 'ADDR', secret: 'SECRET' });
    expect(hasEmbeddedWallet()).toBe(true);
    expect(loadEmbeddedWallet()).toEqual({ address: 'ADDR', secret: 'SECRET' });
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { resolveMode } from './config';

const store = new Map<string, string>();
globalThis.localStorage = {
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

afterEach(() => localStorage.clear?.());

describe('resolveMode', () => {
  it('defaults to live when nothing is set', () => {
    expect(resolveMode(null, undefined)).toBe('live');
  });
  it('honors a persisted demo choice over the default', () => {
    expect(resolveMode('demo', undefined)).toBe('demo');
  });
  it('honors a persisted live choice even when force-demo env is set', () => {
    expect(resolveMode('live', 'true')).toBe('live');
  });
  it('falls back to demo when force-demo env is set and no choice persisted', () => {
    expect(resolveMode(null, 'true')).toBe('demo');
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSolBalance } from './solana-rpc';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getSolBalance', () => {
  it('converts lamports to SOL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: { value: 1_500_000_000 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const balance = await getSolBalance('11111111111111111111111111111111', 'https://rpc.test');

    expect(balance).toBe(1.5);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://rpc.test',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(getSolBalance('addr', 'https://rpc.test')).rejects.toThrow('Solana RPC 500');
  });
});

import { z } from 'zod';

const LAMPORTS_PER_SOL = 1_000_000_000;

const balanceResponseSchema = z.object({
  result: z.object({ value: z.number() }),
});

/** Raw JSON-RPC call — no web3.js. Cluster is whatever `rpcUrl` points at (see SOLANA_RPC_URL). */
export async function getSolBalance(address: string, rpcUrl: string): Promise<number> {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address],
    }),
  });
  if (!res.ok) throw new Error(`Solana RPC ${res.status}`);
  const body = balanceResponseSchema.parse(await res.json());
  return body.result.value / LAMPORTS_PER_SOL;
}

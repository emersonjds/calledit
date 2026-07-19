import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { SOLANA_RPC_URL, TREASURY_ADDRESS, isDemo } from '../config';
import { detectPhantom } from '../../entities/wallet/adapters';

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// Plausible on-chain tx signature (64 bytes ≈ 88 base58 chars) for demo mode.
function mockStakeSignature(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(88));
  return Array.from(bytes, (byte) => BASE58[byte % 58]).join('');
}

// Signs + sends a real devnet SOL transfer from the connected Phantom wallet to the treasury.
export async function signStakeTransfer(from: string, sol: number): Promise<string> {
  // Demo mode has no real wallet/RPC (and a placeholder guest pubkey): return a mock signature.
  if (isDemo()) return mockStakeSignature();
  const provider = detectPhantom(typeof window !== 'undefined' ? window : undefined);
  if (!provider?.signAndSendTransaction)
    throw new Error('Phantom não suporta assinatura de transação');
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  const fromPubkey = new PublicKey(from);
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: new PublicKey(TREASURY_ADDRESS),
      lamports: Math.round(sol * LAMPORTS_PER_SOL),
    }),
  );
  tx.feePayer = fromPubkey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const { signature } = await provider.signAndSendTransaction(tx);
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

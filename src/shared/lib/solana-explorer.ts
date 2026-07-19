// Devnet explorer link for a real transaction signature.
export function explorerTxUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

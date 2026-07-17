export type ChainKind = "solana" | "evm";

export interface WalletAccount {
  address: string;
  balanceSol: number;
  chain: ChainKind;
  provider: string; // "phantom" | "metamask" | "guest"
}

/** A network operation to sign — the seam a real adapter turns into a Solana tx / EVM tx. */
export interface TxIntent {
  kind: "commit-prediction" | "claim-payout";
  payload: Record<string, unknown>;
}

export interface SignResult {
  signature: string;
  ts: number;
}

/**
 * Chain-agnostic wallet contract. Phantom (Solana) is primary, MetaMask (EVM) is a drop-in.
 * The mock adapters route through the API client; real adapters call the injected provider.
 */
export interface WalletAdapter {
  readonly id: string;
  readonly label: string;
  readonly chain: ChainKind;
  isAvailable(): boolean;
  connect(): Promise<WalletAccount>;
  signAndSend(intent: TxIntent): Promise<SignResult>;
}

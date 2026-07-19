import type { ChainKind } from './types';

export interface WalletOption {
  id: string;
  label: string;
  chain: ChainKind;
  installLink: string;
  installed: boolean;
  connect?: () => Promise<string>;
}

interface SolanaProvider {
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
}
interface EvmProvider {
  request: (args: { method: string }) => Promise<string[]>;
}

declare global {
  interface Window {
    phantom?: { solana?: SolanaProvider };
    ethereum?: EvmProvider;
  }
}

function solanaConnect(provider: SolanaProvider): () => Promise<string> {
  return async () => (await provider.connect()).publicKey.toString();
}
function evmConnect(provider: EvmProvider): () => Promise<string> {
  return async () => {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  };
}

/** Reads injected wallet globals; pure w.r.t. the current window so it stays testable. */
export function detectWallets(): WalletOption[] {
  const win: Window | undefined = typeof window !== 'undefined' ? window : undefined;
  const phantom = win?.phantom?.solana;
  const ethereum = win?.ethereum;
  return [
    {
      id: 'phantom',
      label: 'Phantom',
      chain: 'solana',
      installLink: 'https://phantom.app',
      installed: Boolean(phantom),
      connect: phantom ? solanaConnect(phantom) : undefined,
    },
    {
      id: 'metamask',
      label: 'MetaMask',
      chain: 'evm',
      installLink: 'https://metamask.io',
      installed: Boolean(ethereum),
      connect: ethereum ? evmConnect(ethereum) : undefined,
    },
  ];
}

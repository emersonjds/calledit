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
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  publicKey?: { toString(): string };
  signAndSendTransaction?(tx: unknown): Promise<{ signature: string }>;
}
interface EvmProvider {
  isMetaMask?: boolean;
  providers?: EvmProvider[];
  request: (args: { method: string }) => Promise<string[]>;
}

declare global {
  interface Window {
    phantom?: { solana?: SolanaProvider };
    solana?: SolanaProvider;
    ethereum?: EvmProvider;
  }
}

/** Phantom injects at window.phantom.solana; some setups only expose window.solana. */
export function detectPhantom(win: Window | undefined): SolanaProvider | undefined {
  const provider = win?.phantom?.solana ?? win?.solana;
  return provider?.isPhantom ? provider : undefined;
}

/** Multi-wallet browsers (Phantom, Coinbase...) inject an array on window.ethereum.providers. */
function detectMetaMask(win: Window | undefined): EvmProvider | undefined {
  const ethereum = win?.ethereum;
  const fromArray = ethereum?.providers?.find((candidate) => candidate.isMetaMask);
  if (fromArray) return fromArray;
  return ethereum?.isMetaMask ? ethereum : undefined;
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

export function detectWallets(): WalletOption[] {
  const win: Window | undefined = typeof window !== 'undefined' ? window : undefined;
  const phantom = detectPhantom(win);
  const metamask = detectMetaMask(win);
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
      installed: Boolean(metamask),
      connect: metamask ? evmConnect(metamask) : undefined,
    },
  ];
}

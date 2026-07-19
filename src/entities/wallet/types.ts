export type ChainKind = 'solana' | 'evm';

export interface WalletAccount {
  address: string;
  balanceSol: number;
  chain: ChainKind;
  provider: string;
}

export interface TxIntent {
  kind: 'commit-prediction' | 'claim-payout';
  payload: Record<string, unknown>;
}

export interface SignResult {
  signature: string;
  ts: number;
}

export interface WalletAdapter {
  readonly id: string;
  readonly label: string;
  readonly chain: ChainKind;
  isAvailable(): boolean;
  connect(): Promise<WalletAccount>;
  signAndSend(intent: TxIntent): Promise<SignResult>;
}

export type ActivityType = 'deposit' | 'withdraw' | 'payout' | 'stake';

export interface WalletActivity {
  id: string;
  type: ActivityType;
  amountSol: number;
  fiatAmount?: number;
  method?: string;
  status: 'settled' | 'pending';
  ts: number;
}

export interface WalletOverview {
  address: string;
  balanceSol: number;
  currency: string;
  fiatRate: number;
  activity: WalletActivity[];
}

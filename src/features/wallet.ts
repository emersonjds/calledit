import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WalletOverview } from '@/entities/wallet';
import { api } from '@/shared/api';
import { useSession } from '@/store/session';
import { SOLANA_RPC_URL } from '@/shared/config';
import { getSolBalance } from '@/shared/lib/solana-rpc';

/** Connect a wallet provider through the adapter seam. `address` is set for app-created/embedded wallets. */
export function useConnectWallet() {
  const connect = useSession((state) => state.connect);
  return useMutation({
    mutationFn: ({ provider, address }: { provider: string; address?: string }) =>
      api.connectWallet(provider, address),
    // In live mode the backend echoes a stub address; if the caller supplied a real one, keep it.
    onSuccess: (account, { address }) => connect(address ? { ...account, address } : account),
  });
}

export function useWalletOverview() {
  const address = useSession((state) => state.address);
  return useQuery<WalletOverview>({
    queryKey: ['wallet', address],
    queryFn: () => api.getWallet(address as string),
    enabled: address !== null,
    refetchInterval: 3000,
  });
}

/** Real on-chain SOL balance for a connected Solana address. Never crashes the page — errors just leave the value undefined and the caller falls back to the stub balance. */
export function useOnchainBalance(address: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['onchain-balance', address],
    queryFn: () => getSolBalance(address as string, SOLANA_RPC_URL),
    enabled: enabled && address !== null,
    staleTime: 10_000,
    refetchInterval: 15_000,
    retry: 1,
  });
}

function useWalletMutation<TArgs>(mutationFn: (args: TArgs) => Promise<WalletOverview>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

/** On-ramp: local fiat → SOL. */
export function useDeposit() {
  const address = useSession((state) => state.address);
  return useWalletMutation((amountSol: number) => api.deposit(address as string, amountSol));
}

/** Off-ramp: SOL → local fiat, paid out to the user's bank (e.g. PIX). */
export function useWithdraw() {
  const address = useSession((state) => state.address);
  return useWalletMutation((args: { amountSol: number; method: string }) =>
    api.withdraw(address as string, args.amountSol, args.method),
  );
}

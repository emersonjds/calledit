import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WalletOverview } from '@/entities/wallet';
import { api } from '@/shared/api';
import { useSession } from '@/store/session';
import { SOLANA_RPC_URL } from '@/shared/config';
import { getSolBalance } from '@/shared/lib/solana-rpc';

export function useConnectWallet() {
  const connect = useSession((state) => state.connect);
  return useMutation({
    mutationFn: ({ provider, address }: { provider: string; address?: string }) =>
      api.connectWallet(provider, address),
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

export function useDeposit() {
  const address = useSession((state) => state.address);
  return useWalletMutation((amountSol: number) => api.deposit(address as string, amountSol));
}

export function useWithdraw() {
  const address = useSession((state) => state.address);
  return useWalletMutation((args: { amountSol: number; method: string }) =>
    api.withdraw(address as string, args.amountSol, args.method),
  );
}

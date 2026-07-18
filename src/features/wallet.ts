import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WalletOverview } from '@/entities/wallet';
import { api } from '@/shared/api';
import { useSession } from '@/store/session';

/** Connect a wallet provider (Phantom / MetaMask / guest) through the adapter seam. */
export function useConnectWallet() {
  const connect = useSession((state) => state.connect);
  return useMutation({
    mutationFn: (provider: string) => api.connectWallet(provider),
    onSuccess: (account) => connect(account),
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MarketId, Prediction } from '@/entities/prediction';
import { api } from '@/shared/api';
import { signStakeTransfer } from '@/shared/lib/solana-transfer';
import { useSession } from '@/store/session';

export interface CommitArgs {
  market: MarketId;
  stakeSol: number;
}

/** Commit a prediction: stamps on-chain, then tracks it as the active call. */
export function useMakePrediction() {
  const queryClient = useQueryClient();
  const address = useSession((state) => state.address);
  const matchId = useSession((state) => state.matchId);
  const setActive = useSession((state) => state.setActivePrediction);

  return useMutation({
    mutationFn: async (args: CommitArgs) => {
      if (!address) throw new Error('Connect a wallet first');
      // Real devnet stake: Phantom prompts to sign before the prediction is committed.
      let stakeTxSig: string;
      try {
        stakeTxSig = await signStakeTransfer(address, args.stakeSol);
      } catch (err) {
        throw new Error(
          `Stake transfer failed — approve the Phantom prompt and keep enough devnet SOL for the stake plus fees. (${err instanceof Error ? err.message : String(err)})`,
          { cause: err },
        );
      }
      return api.commitPrediction({
        matchId,
        market: args.market,
        stakeSol: args.stakeSol,
        address,
        stakeTxSig,
      });
    },
    onSuccess: (prediction) => {
      setActive(prediction.id);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

/** Poll a prediction until it settles on-chain. */
export function usePredictionStatus(id: string | null) {
  const queryClient = useQueryClient();
  return useQuery<Prediction>({
    queryKey: ['prediction', id],
    queryFn: async () => {
      const prediction = await api.getPrediction(id as string);
      if (prediction.status !== 'resolving') {
        queryClient.invalidateQueries({ queryKey: ['me'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      }
      return prediction;
    },
    enabled: id !== null,
    refetchInterval: (query) =>
      query.state.data && query.state.data.status !== 'resolving' ? false : 700,
  });
}

import { create } from 'zustand';
import type { MarketId } from '@/entities/prediction';
import type { ChainKind, WalletAccount } from '@/entities/wallet';
import { DEMO_MATCH_ID } from '@/mocks/config';
import { LIVE_MATCH_ID, isDemo } from '@/shared/config';

interface SessionState {
  address: string | null;
  provider: string | null;
  chain: ChainKind | null;
  matchId: string;
  selectedMarket: MarketId | null;
  activePredictionId: string | null;
  connect: (account: WalletAccount) => void;
  disconnect: () => void;
  selectMarket: (market: MarketId | null) => void;
  setActivePrediction: (id: string | null) => void;
}

export const useSession = create<SessionState>((set) => ({
  address: null,
  provider: null,
  chain: null,
  matchId: isDemo() ? DEMO_MATCH_ID : LIVE_MATCH_ID,
  selectedMarket: null,
  activePredictionId: null,
  connect: (account) =>
    set({
      address: account.address,
      provider: account.provider,
      chain: account.chain,
    }),
  disconnect: () => set({ address: null, provider: null, chain: null, activePredictionId: null }),
  selectMarket: (market) => set({ selectedMarket: market }),
  setActivePrediction: (id) => set({ activePredictionId: id }),
}));

export const useIsConnected = () => useSession((state) => state.address !== null);

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarketId } from "@/entities/prediction";
import type { ChainKind, WalletAccount } from "@/entities/wallet";
import { DEMO_MATCH_ID } from "@/mocks/config";

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

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      address: null,
      provider: null,
      chain: null,
      matchId: DEMO_MATCH_ID,
      selectedMarket: null,
      activePredictionId: null,
      connect: (account) =>
        set({
          address: account.address,
          provider: account.provider,
          chain: account.chain,
        }),
      disconnect: () =>
        set({ address: null, provider: null, chain: null, activePredictionId: null }),
      selectMarket: (market) => set({ selectedMarket: market }),
      setActivePrediction: (id) => set({ activePredictionId: id }),
    }),
    {
      name: "called-it:session",
      partialize: (state) => ({
        address: state.address,
        provider: state.provider,
        chain: state.chain,
      }),
    },
  ),
);

export const useIsConnected = () => useSession((state) => state.address !== null);

import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api";
import { useSession } from "@/store/session";

/** Connect a wallet provider (Phantom / MetaMask / guest) through the adapter seam. */
export function useConnectWallet() {
  const connect = useSession((state) => state.connect);
  return useMutation({
    mutationFn: (provider: string) => api.connectWallet(provider),
    onSuccess: (account) => connect(account),
  });
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Mail, Wallet } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { CreateWalletSheet } from '@/widgets/create-wallet-sheet';
import { useConnectWallet } from '@/features/wallet';
import { useAppMode } from '@/store/app-mode';
import {
  createEmbeddedWallet,
  loadEmbeddedWallet,
  saveEmbeddedWallet,
} from '@/shared/lib/solana-keypair';

export function OnboardingPage() {
  const navigate = useNavigate();
  const connect = useConnectWallet();
  const enterDemo = useAppMode((state) => state.enterDemo);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const goHome = () => navigate('/', { replace: true });

  const enter = (provider: string) => connect.mutate({ provider }, { onSuccess: goHome });

  // Google here is a simulated OAuth backed by the same embedded wallet (real SDK swap is the deferred step).
  const enterWithGoogle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const wallet = loadEmbeddedWallet() ?? (await createEmbeddedWallet());
      saveEmbeddedWallet(wallet);
      connect.mutate(
        { provider: 'google', address: wallet.address },
        { onSuccess: goHome, onSettled: () => setBusy(false) },
      );
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="bg-background flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-between px-6 py-14 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="border-lime glow-lime relative flex size-32 items-center justify-center rounded-full border-2">
          <Check className="text-lime size-16" strokeWidth={3} />
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-lime text-4xl font-extrabold tracking-tight">
            CALLED IT
          </h1>
          <p className="font-display text-foreground text-2xl font-bold">
            Prove you called <span className="text-lime italic">it</span> first.
          </p>
          <p className="text-muted-foreground mx-auto max-w-xs text-sm">
            Commit a prediction before it happens. It gets stamped on-chain. Nobody can fake a call.
          </p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <Button
          size="lg"
          disabled={connect.isPending || busy}
          onClick={enterWithGoogle}
          className="bg-foreground text-background hover:bg-foreground/90 h-14 w-full text-base font-bold"
        >
          <Mail className="size-5" /> Continue with Google
        </Button>
        <Button
          size="lg"
          disabled={connect.isPending}
          onClick={() => enter('phantom')}
          className="bg-lime text-background hover:bg-lime/90 h-14 w-full text-base font-bold"
        >
          <Wallet className="size-5" /> Connect Phantom
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled={connect.isPending}
            onClick={() => enter('metamask')}
            className="border-border h-12"
          >
            MetaMask
          </Button>
          <Button
            variant="outline"
            disabled={connect.isPending}
            onClick={() => setCreateOpen(true)}
            className="border-border h-12"
          >
            Create wallet
          </Button>
        </div>
        <Button
          size="lg"
          variant="ghost"
          disabled={connect.isPending}
          onClick={() => enter('guest')}
          className="text-muted-foreground h-12 w-full"
        >
          Play as guest
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={enterDemo}
          className="text-flame h-11 w-full text-sm"
        >
          Enter as demo (simulated)
        </Button>
        <p className="text-muted-foreground pt-2 text-xs">
          🔒 Secured by Solana · By connecting you agree to the Terms and confirm you are over 18.
        </p>
      </div>

      <CreateWalletSheet open={createOpen} onOpenChange={setCreateOpen} onConnected={goHome} />
    </div>
  );
}

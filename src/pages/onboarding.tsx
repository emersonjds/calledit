import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { CreateWalletSheet } from '@/widgets/create-wallet-sheet';
import { WalletModal } from '@/widgets/wallet-modal';
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
  const setMode = useAppMode((state) => state.setMode);
  const [createOpen, setCreateOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const goHome = () => navigate('/', { replace: true });

  const enter = (provider: string) => connect.mutate({ provider }, { onSuccess: goHome });

  // Demo: switch to simulated mode, boot MSW, then enter the app as a guest — no reload.
  const enterDemo = async () => {
    if (busy) return;
    setBusy(true);
    setMode('demo');
    const { startMockServer } = await import('@/mocks/browser');
    await startMockServer();
    connect.mutate({ provider: 'guest' }, { onSuccess: goHome, onSettled: () => setBusy(false) });
  };

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
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-between overflow-y-auto px-6 py-14 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
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
            Every call is stamped on-chain — no one can fake being first.
          </p>
          <span className="border-lime/40 text-lime inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs">
            <Link2 className="size-3" /> Solana-verified
          </span>
        </div>
      </div>

      <div className="w-full space-y-4">
        <Button
          size="lg"
          disabled={connect.isPending || busy}
          onClick={() => setWalletOpen(true)}
          className="bg-lime text-background hover:bg-lime/90 h-14 w-full text-base font-bold"
        >
          Log in or sign up
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            disabled={connect.isPending || busy}
            onClick={() => enter('guest')}
            className="text-muted-foreground hover:text-foreground px-2 py-3 disabled:opacity-60"
          >
            Continue as guest
          </button>
          <span className="text-muted-foreground/40">·</span>
          <button
            disabled={connect.isPending || busy}
            onClick={enterDemo}
            className="text-flame/90 hover:text-flame px-2 py-3 disabled:opacity-60"
          >
            Try the demo
          </button>
        </div>

        <p className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-1.5 text-xs">
          <img src="/solana.png" alt="Solana" className="size-3.5" />
          <span>Secured by Solana · Terms apply · 18+</span>
        </p>
      </div>

      <CreateWalletSheet open={createOpen} onOpenChange={setCreateOpen} onConnected={goHome} />
      <WalletModal
        open={walletOpen}
        onOpenChange={setWalletOpen}
        onConnected={goHome}
        onGoogle={enterWithGoogle}
        onCreateNew={() => setCreateOpen(true)}
        busy={busy}
      />
    </div>
  );
}

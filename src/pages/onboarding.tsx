import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Link2, Zap } from 'lucide-react';
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

  // Demo mode only boots MSW at startup (main.tsx) and the session store reads the matchId once
  // at module load — switching mode in place leaves both stale (real API 404s, wrong match).
  // So "Try the demo" reloads into a fresh demo boot; this effect finishes that handoff by
  // connecting as guest once the page comes back up in demo mode.
  useEffect(() => {
    const resumingDemo = new URLSearchParams(window.location.search).get('demo') === '1';
    if (!resumingDemo) {
      // A fresh landing is always live (fetch real data); only "Try the demo" opts into the sandbox.
      setMode('live');
      return;
    }
    window.history.replaceState({}, '', '/onboarding');
    connect.mutate({ provider: 'guest' }, { onSuccess: goHome });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMode]);

  const enterDemo = () => {
    if (busy) return;
    setMode('demo');
    window.location.assign('/onboarding?demo=1');
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

  const disabled = connect.isPending || busy;

  return (
    <main className="no-scrollbar flex min-h-0 w-full flex-1 flex-col items-center justify-between overflow-y-auto px-6 py-14 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        <div
          aria-hidden="true"
          className="border-lime glow-lime bg-card/40 relative flex size-32 items-center justify-center rounded-full border-2"
        >
          <Check className="text-lime size-16" strokeWidth={3} />
        </div>
        <div className="space-y-3.5">
          <h1 className="font-display text-lime text-4xl font-extrabold tracking-tight">
            CALLED IT
          </h1>
          <p className="font-display text-foreground text-2xl font-bold">
            Prove you called <span className="text-lime italic">it</span> first.
          </p>
          <p className="text-muted-foreground mx-auto max-w-xs text-sm leading-relaxed">
            Every call is stamped on-chain — no one can fake being first.
          </p>
          <span className="border-lime/40 bg-lime/5 text-lime inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-xs font-medium">
            <span className="relative flex size-1.5" aria-hidden="true">
              <span className="bg-lime absolute inline-flex size-full rounded-full opacity-75 motion-safe:animate-ping motion-reduce:hidden" />
              <span className="bg-lime relative inline-flex size-1.5 rounded-full" />
            </span>
            <Link2 className="size-3" aria-hidden="true" />
            Solana-verified
          </span>
        </div>
      </div>

      <div className="w-full space-y-4">
        <div className="space-y-3">
          <Button
            size="lg"
            disabled={disabled}
            onClick={() => setWalletOpen(true)}
            className="bg-lime text-background hover:bg-lime/90 h-14 w-full touch-manipulation text-base font-bold"
          >
            Log in or sign up
          </Button>

          <button
            type="button"
            disabled={disabled}
            onClick={enterDemo}
            className="border-flame/50 bg-flame/10 text-flame hover:border-flame hover:bg-flame/15 focus-visible:ring-ring/50 flex h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-md border text-sm font-semibold transition-colors outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
          >
            <Zap className="size-4" aria-hidden="true" />
            Try the demo
          </button>
        </div>

        <p className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-1.5 text-xs">
          <img src="/solana.png" alt="Solana" width={14} height={14} className="size-3.5" />
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
    </main>
  );
}

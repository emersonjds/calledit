import { useNavigate } from 'react-router-dom';
import { Check, Wallet } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useConnectWallet } from '@/features/wallet';

export function OnboardingPage() {
  const navigate = useNavigate();
  const connect = useConnectWallet();

  const enter = (provider: string) =>
    connect.mutate(provider, { onSuccess: () => navigate('/', { replace: true }) });

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
          disabled={connect.isPending}
          onClick={() => enter('phantom')}
          className="bg-lime text-background hover:bg-lime/90 h-14 w-full text-base font-bold"
        >
          <Wallet className="size-5" /> Connect Phantom
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={connect.isPending}
          onClick={() => enter('guest')}
          className="border-border text-muted-foreground h-12 w-full"
        >
          Play as guest
        </Button>
        <p className="text-muted-foreground pt-2 text-xs">
          🔒 Secured by Solana · By connecting you agree to the Terms and confirm you are over 18.
        </p>
      </div>
    </div>
  );
}

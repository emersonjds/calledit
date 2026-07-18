import { useNavigate } from "react-router-dom";
import { Check, Wallet } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useConnectWallet } from "@/features/wallet";

export function OnboardingPage() {
  const navigate = useNavigate();
  const connect = useConnectWallet();

  const enter = (provider: string) =>
    connect.mutate(provider, { onSuccess: () => navigate("/", { replace: true }) });

  return (
    <div className="flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-between bg-background px-6 py-14 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="relative flex size-32 items-center justify-center rounded-full border-2 border-lime glow-lime">
          <Check className="size-16 text-lime" strokeWidth={3} />
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-lime">
            CALLED IT
          </h1>
          <p className="font-display text-2xl font-bold text-foreground">
            Prove you called <span className="italic text-lime">it</span> first.
          </p>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            Commit a prediction before it happens. It gets stamped on-chain. Nobody
            can fake a call.
          </p>
        </div>
      </div>

      <div className="w-full space-y-3">
        <Button
          size="lg"
          disabled={connect.isPending}
          onClick={() => enter("phantom")}
          className="h-14 w-full bg-lime text-base font-bold text-background hover:bg-lime/90"
        >
          <Wallet className="size-5" /> Connect Phantom
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={connect.isPending}
          onClick={() => enter("guest")}
          className="h-12 w-full border-border text-muted-foreground"
        >
          Play as guest
        </Button>
        <p className="pt-2 text-xs text-muted-foreground">
          🔒 Secured by Solana · By connecting you agree to the Terms and confirm you
          are over 18.
        </p>
      </div>
    </div>
  );
}

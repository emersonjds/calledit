import { useState } from 'react';
import { ExternalLink, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { detectWallets, type WalletOption } from '@/entities/wallet/adapters';
import { useConnectWallet } from '@/features/wallet';
import { WalletLogo } from '@/widgets/wallet-icons';

export interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
  onGoogle: () => void | Promise<void>;
  onCreateNew: () => void;
  busy?: boolean;
}

const ROW =
  'border-border bg-background hover:border-lime/50 flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors disabled:opacity-60';

export function WalletModal({
  open,
  onOpenChange,
  onConnected,
  onGoogle,
  onCreateNew,
  busy = false,
}: WalletModalProps) {
  const connect = useConnectWallet();
  const [wallets] = useState<WalletOption[]>(detectWallets);
  const [connecting, setConnecting] = useState(false);
  const pending = connecting || connect.isPending || busy;

  const pick = async (option: WalletOption) => {
    if (!option.connect) {
      window.open(option.installLink, '_blank', 'noopener');
      return;
    }
    setConnecting(true);
    try {
      const address = await option.connect();
      connect.mutate(
        { provider: option.id, address },
        {
          onSuccess: () => {
            onOpenChange(false);
            onConnected();
          },
        },
      );
    } catch (error) {
      // Phantom/MetaMask signal a real user-rejection with code 4001; anything else is a genuine failure.
      const code =
        typeof error === 'object' && error !== null ? Reflect.get(error, 'code') : undefined;
      if (code === 4001) {
        toast.error(`${option.label} connection was rejected`);
        return;
      }
      const message =
        error instanceof Error ? error.message : `Could not connect to ${option.label}`;
      console.error(`${option.label} connect failed`, error);
      toast.error(message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card mx-auto w-[calc(100%-2.5rem)] max-w-[400px] rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="font-display text-foreground">Log in or sign up</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose how you want to call it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 pb-1">
          <button disabled={pending} onClick={onGoogle} className={ROW}>
            <span className="bg-background border-border flex size-9 shrink-0 items-center justify-center rounded-lg border">
              <Mail className="size-4" />
            </span>
            <span className="text-foreground flex-1 font-semibold">Continue with Google</span>
            <span className="text-lime text-xs">Fastest</span>
          </button>

          {wallets.map((option) => (
            <button key={option.id} disabled={pending} onClick={() => pick(option)} className={ROW}>
              <WalletLogo id={option.id} />
              <span className="text-foreground flex-1 font-semibold">{option.label}</span>
              {option.installed ? (
                <span className="text-lime text-xs">Detected</span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  Install <ExternalLink className="size-3" />
                </span>
              )}
            </button>
          ))}

          <div className="text-muted-foreground flex items-center gap-3 py-1 text-xs">
            <span className="border-border flex-1 border-t" />
            or
            <span className="border-border flex-1 border-t" />
          </div>

          <button
            disabled={pending}
            onClick={() => {
              onOpenChange(false);
              onCreateNew();
            }}
            className={ROW}
          >
            <span className="flex size-9 shrink-0 items-center justify-center">
              <img src="/solana.png" alt="Solana" className="size-6" />
            </span>
            <span className="text-foreground flex-1 font-semibold">Create a new wallet</span>
          </button>

          <p className="text-muted-foreground pt-1 text-center text-[11px]">
            By continuing you agree to the Terms and confirm you are 18+.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

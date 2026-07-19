import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
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

export interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

export function WalletModal({ open, onOpenChange, onConnected }: WalletModalProps) {
  const connect = useConnectWallet();
  const [wallets] = useState<WalletOption[]>(detectWallets);

  const pick = async (option: WalletOption) => {
    if (!option.connect) {
      window.open(option.installLink, '_blank', 'noopener');
      return;
    }
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
    } catch {
      toast.error(`${option.label} connection was rejected`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card mx-auto max-w-[400px]">
        <DialogHeader className="text-center">
          <DialogTitle className="font-display text-foreground">Log in or sign up</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Connect a Solana or EVM wallet to call it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pb-2">
          {wallets.map((option) => (
            <button
              key={option.id}
              disabled={connect.isPending}
              onClick={() => pick(option)}
              className="border-border bg-background hover:border-lime/50 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-60"
            >
              <span className="bg-card text-foreground flex size-9 items-center justify-center rounded-lg text-sm font-bold">
                {option.label.charAt(0)}
              </span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

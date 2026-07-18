import { useState } from 'react';
import { Copy, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/shared/ui/drawer';
import { useConnectWallet } from '@/features/wallet';
import {
  createEmbeddedWallet,
  saveEmbeddedWallet,
  type EmbeddedWallet,
} from '@/shared/lib/solana-keypair';

export interface CreateWalletSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

type Stage = 'generating' | 'backup' | 'unsupported';

export function CreateWalletSheet({ open, onOpenChange, onConnected }: CreateWalletSheetProps) {
  const [stage, setStage] = useState<Stage>('generating');
  const [wallet, setWallet] = useState<EmbeddedWallet | null>(null);
  const [revealed, setRevealed] = useState(false);
  const connect = useConnectWallet();

  const generate = async () => {
    setStage('generating');
    setRevealed(false);
    try {
      const created = await createEmbeddedWallet();
      setWallet(created);
      setStage('backup');
    } catch {
      setStage('unsupported');
    }
  };

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const finish = () => {
    if (!wallet) return;
    saveEmbeddedWallet(wallet);
    connect.mutate(
      { provider: 'solana', address: wallet.address },
      {
        onSuccess: () => {
          onOpenChange(false);
          onConnected();
        },
      },
    );
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) void generate();
      }}
    >
      <DrawerContent className="bg-card mx-auto max-w-[430px]">
        <DrawerHeader className="text-center">
          <DrawerTitle className="font-display text-lime">Create a Solana wallet</DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Generated on your device. Back up your secret — it is the only way to restore it.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-8">
          {stage === 'generating' && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8">
              <Spinner /> Generating your wallet…
            </div>
          )}

          {stage === 'unsupported' && (
            <p className="text-flame py-8 text-center text-sm">
              Your browser can’t create a wallet here. Update it, or connect Phantom instead.
            </p>
          )}

          {stage === 'backup' && wallet && (
            <>
              <div className="border-border rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Your Solana address</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-foreground font-mono text-xs break-all">
                    {wallet.address}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copy(wallet.address, 'Address')}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="border-flame/40 rounded-lg border p-3">
                <p className="text-flame text-xs">Secret key — never share it</p>
                {revealed ? (
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-foreground font-mono text-xs break-all">
                      {wallet.secret}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copy(wallet.secret, 'Secret')}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => setRevealed(true)}
                  >
                    Reveal secret
                  </Button>
                )}
              </div>

              <Button
                disabled={!revealed || connect.isPending}
                onClick={finish}
                className="bg-lime text-background hover:bg-lime/90 h-12 w-full font-bold"
              >
                <ShieldCheck className="size-5" /> I saved it — continue
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { CreateWalletSheet } from '@/widgets/create-wallet-sheet';
import { useSession } from '@/store/session';
import { hasEmbeddedWallet } from '@/shared/lib/solana-keypair';

export function SolanaWalletNudge() {
  const chain = useSession((state) => state.chain);
  const provider = useSession((state) => state.provider);
  const [dismissed, setDismissed] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const needsSolanaWallet = (chain === 'evm' || provider === 'guest') && !hasEmbeddedWallet();

  if (dismissed || !needsSolanaWallet) return null;

  return (
    <>
      <div className="border-flame/40 bg-card mx-auto flex max-w-[430px] items-center gap-3 rounded-lg border px-4 py-3">
        <div className="flex-1">
          <p className="text-foreground text-sm font-semibold">Create a Solana wallet</p>
          <p className="text-muted-foreground text-xs">Needed to play and cash out in SOL.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="bg-lime text-background hover:bg-lime/90 font-bold"
        >
          Create
        </Button>
        <Button size="icon" variant="ghost" aria-label="Dismiss" onClick={() => setDismissed(true)}>
          <X className="size-4" />
        </Button>
      </div>
      <CreateWalletSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onConnected={() => setDismissed(true)}
      />
    </>
  );
}

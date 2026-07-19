import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useIsConnected } from '@/store/session';
import { DemoBadge } from '@/widgets/demo-badge';
import { SolanaWalletNudge } from '@/widgets/solana-wallet-nudge';
import { BottomNav } from './bottom-nav';

export function RequireWallet({ children }: { children: ReactNode }) {
  const connected = useIsConnected();
  if (!connected) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function AppLayout() {
  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col">
      <main className="no-scrollbar flex-1 overflow-y-auto pb-2">
        <DemoBadge />
        <SolanaWalletNudge />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

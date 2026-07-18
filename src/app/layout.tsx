import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useIsConnected } from '@/store/session';
import { BottomNav } from './bottom-nav';

export function RequireWallet({ children }: { children: ReactNode }) {
  const connected = useIsConnected();
  if (!connected) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function AppLayout() {
  return (
    <div className="bg-background relative flex min-h-dvh w-full max-w-[430px] flex-col">
      <main className="flex-1 overflow-y-auto pb-2">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

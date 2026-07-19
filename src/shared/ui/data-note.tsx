import type { ReactNode } from 'react';
import { getMode } from '@/shared/config';

export function DataNote({ children }: { children: ReactNode }) {
  if (getMode() !== 'live') return null;
  return (
    <p className="text-muted-foreground mx-auto max-w-[430px] px-4 pt-2 text-center text-[10px]">
      {children}
    </p>
  );
}

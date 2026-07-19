import { create } from 'zustand';
import { getMode, persistMode, type AppMode } from '@/shared/config';
import { useSession } from '@/store/session';

interface AppModeState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  exitDemo: () => void;
}

export const useAppMode = create<AppModeState>((set) => ({
  mode: getMode(),
  setMode: (mode) => {
    persistMode(mode);
    set({ mode });
  },
  exitDemo: () => {
    persistMode('live');
    useSession.getState().disconnect();
    window.location.assign('/onboarding');
  },
}));

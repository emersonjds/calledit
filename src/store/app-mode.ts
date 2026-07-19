import { create } from 'zustand';
import { getMode, persistMode, type AppMode } from '@/shared/config';

interface AppModeState {
  mode: AppMode;
  enterDemo: () => void;
  exitDemo: () => void;
}

// enterDemo/exitDemo persist then reload, so bootstrap re-runs and MSW starts/stops cleanly.
export const useAppMode = create<AppModeState>((set) => ({
  mode: getMode(),
  enterDemo: () => {
    persistMode('demo');
    set({ mode: 'demo' });
    window.location.assign('/onboarding');
  },
  exitDemo: () => {
    persistMode('live');
    set({ mode: 'live' });
    window.location.assign('/onboarding');
  },
}));

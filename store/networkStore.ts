import { create } from 'zustand';
import { isOnline, startNetworkMonitor } from '../utils/netInfo';

interface NetworkState {
  isConnected: boolean;
  lastOfflineAt: number | null; // timestamp ms
  _unsubscribe: (() => void) | null;

  // actions
  init: () => void;
  teardown: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true,       // optimistic default
  lastOfflineAt: null,
  _unsubscribe: null,

  init: () => {
    // guard: already initialised
    if (get()._unsubscribe) return;

    // 1. one-time fetch for immediate correct state
    isOnline().then((online) => {
      set({
        isConnected: online,
        lastOfflineAt: online ? get().lastOfflineAt : Date.now(),
      });
    });

    // 2. continuous listener
    const unsubscribe = startNetworkMonitor(
      () => {
        // came back online — preserve lastOfflineAt for UI
        set({ isConnected: true });
      },
      () => {
        set({ isConnected: false, lastOfflineAt: Date.now() });
      },
    );

    set({ _unsubscribe: unsubscribe });
  },

  teardown: () => {
    get()._unsubscribe?.();
    set({ _unsubscribe: null });
  },
}));
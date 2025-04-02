import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  showQuickChat: boolean;
  showTokenPrice: boolean;
  toggleQuickChat: () => void;
  toggleTokenPrice: () => void;
  setShowQuickChat: (show: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      showQuickChat: false,
      showTokenPrice: true,
      toggleQuickChat: () => set((state) => ({ showQuickChat: !state.showQuickChat })),
      toggleTokenPrice: () => set((state) => ({ showTokenPrice: !state.showTokenPrice })),
      setShowQuickChat: (show) => set({ showQuickChat: show }),
    }),
    {
      name: 'ui-settings',
    }
  )
);
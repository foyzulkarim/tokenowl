import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "tokenowl_ui",
      version: 1,
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
      storage: createJSONStorage(() => ({
        getItem: (...args) => localStorage.getItem(...args),
        setItem: (...args) => localStorage.setItem(...args),
        removeItem: (...args) => localStorage.removeItem(...args),
      })),
    },
  ),
);

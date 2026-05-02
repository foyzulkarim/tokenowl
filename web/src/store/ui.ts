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
      // Lazy wrapper so tests can stub window.localStorage after module load
      storage: createJSONStorage(() => ({
        getItem: (name) => window.localStorage.getItem(name),
        setItem: (name, value) => window.localStorage.setItem(name, value),
        removeItem: (name) => window.localStorage.removeItem(name),
      })),
    },
  ),
);

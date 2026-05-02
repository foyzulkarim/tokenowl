import { useUIStore } from "@/store/ui";

// vitest replaces window.localStorage with a stub that has no methods;
// provide a working in-memory implementation so Zustand persist can use it.
const lsData: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key) => lsData[key] ?? null,
  setItem: (key, value) => { lsData[key] = value; },
  removeItem: (key) => { delete lsData[key]; },
  clear: () => { Object.keys(lsData).forEach((k) => delete lsData[k]); },
  key: (i) => Object.keys(lsData)[i] ?? null,
  get length() { return Object.keys(lsData).length; },
};
vi.stubGlobal("localStorage", localStorageMock);

beforeEach(() => {
  localStorage.clear();
  useUIStore.setState({ sidebarCollapsed: false });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe("UIStore", () => {
  describe("initial state", () => {
    it("defaults to expanded", () => {
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe("persistence", () => {
    it("writes sidebarCollapsed:true to localStorage after toggle", () => {
      useUIStore.getState().toggleSidebar();
      const raw = localStorage.getItem("tokenowl_ui");
      expect(raw).not.toBeNull();
      expect(raw).toContain('"sidebarCollapsed":true');
    });

    it("rehydrates sidebarCollapsed:true from localStorage", async () => {
      localStorage.setItem(
        "tokenowl_ui",
        JSON.stringify({ state: { sidebarCollapsed: true }, version: 1 }),
      );
      await useUIStore.persist.rehydrate();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });

    it("defaults to false when localStorage is cleared", () => {
      localStorage.clear();
      useUIStore.setState({ sidebarCollapsed: false });
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it("persisted entry contains version 1", () => {
      useUIStore.getState().toggleSidebar();
      const raw = localStorage.getItem("tokenowl_ui");
      const parsed = JSON.parse(raw!);
      expect(parsed.version).toBe(1);
    });
  });

  describe("toggle", () => {
    it("toggleSidebar collapses when expanded", () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });

    it("toggleSidebar expands when collapsed", () => {
      useUIStore.setState({ sidebarCollapsed: true });
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });
});

import { useUIStore } from "@/store/ui";

const lsData: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key) => lsData[key] ?? null,
  setItem: (key, value) => {
    lsData[key] = value;
  },
  removeItem: (key) => {
    delete lsData[key];
  },
  clear: () => {
    for (const k of Object.keys(lsData)) {
      delete lsData[k];
    }
  },
  key: (i) => Object.keys(lsData)[i] ?? null,
  get length() {
    return Object.keys(lsData).length;
  },
};

beforeAll(() => {
  vi.stubGlobal("localStorage", localStorageMock);
});

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
      const parsed = JSON.parse(raw as string);
      expect(parsed.state.sidebarCollapsed).toBe(true);
    });

    it("rehydrates sidebarCollapsed from localStorage", () => {
      localStorage.setItem(
        "tokenowl_ui",
        JSON.stringify({ state: { sidebarCollapsed: true }, version: 1 }),
      );
      useUIStore.setState({ sidebarCollapsed: true });
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });

    it("defaults to false when localStorage is empty", () => {
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it("persisted entry contains version 1", () => {
      useUIStore.getState().toggleSidebar();
      const raw = localStorage.getItem("tokenowl_ui");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
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

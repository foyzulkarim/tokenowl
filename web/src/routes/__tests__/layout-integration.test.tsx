import { routeTree } from "@/routeTree.gen";
import { useUIStore } from "@/store/ui";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";

const lsData: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key: string) => lsData[key] ?? null,
  setItem: (key: string, value: string) => {
    lsData[key] = value;
  },
  removeItem: (key: string) => {
    delete lsData[key];
  },
  clear: () => {
    for (const k of Object.keys(lsData)) {
      delete lsData[k];
    }
  },
  key: (i: number) => Object.keys(lsData)[i] ?? null,
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

async function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history });
  await router.load();
  render(<RouterProvider router={router} />);
  return router;
}

const ROUTES = [
  "/dashboard",
  "/sessions",
  "/sessions/test-id",
  "/proposals",
  "/proposals/test-id",
  "/patterns",
  "/effectiveness",
  "/chat",
  "/runs",
  "/settings",
];

const NAV_LABELS = [
  "Dashboard",
  "Sessions",
  "Proposals",
  "Patterns",
  "Effectiveness",
  "Chat",
  "Runs",
  "Settings",
];

describe("Layout integration", () => {
  it.each(ROUTES)("header visible on %s", async (path) => {
    await renderAt(path);
    expect(screen.getByText("TokenOwl")).toBeInTheDocument();
  });

  it.each(ROUTES)("sidebar nav items visible on %s", async (path) => {
    await renderAt(path);
    for (const label of NAV_LABELS) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });
});

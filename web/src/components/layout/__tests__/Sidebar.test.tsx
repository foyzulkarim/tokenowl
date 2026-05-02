import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUIStore } from "@/store/ui";

const lsData: Record<string, string> = {};
vi.stubGlobal("localStorage", {
  getItem: (key: string) => lsData[key] ?? null,
  setItem: (key: string, value: string) => { lsData[key] = value; },
  removeItem: (key: string) => { delete lsData[key]; },
  clear: () => { Object.keys(lsData).forEach((k) => delete lsData[k]); },
  key: (i: number) => Object.keys(lsData)[i] ?? null,
  get length() { return Object.keys(lsData).length; },
});

beforeEach(() => {
  localStorage.clear();
  useUIStore.setState({ sidebarCollapsed: false });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

async function renderSidebarAt(path: string) {
  const rootRoute = createRootRoute({ component: () => <Sidebar /> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
  return router;
}

const NAV_ITEMS = [
  { label: "Dashboard", route: "/dashboard" },
  { label: "Sessions", route: "/sessions" },
  { label: "Proposals", route: "/proposals" },
  { label: "Patterns", route: "/patterns" },
  { label: "Effectiveness", route: "/effectiveness" },
  { label: "Chat", route: "/chat" },
  { label: "Runs", route: "/runs" },
  { label: "Settings", route: "/settings" },
];

describe("Sidebar", () => {
  describe("nav items", () => {
    it("renders all 8 nav items", async () => {
      await renderSidebarAt("/dashboard");
      expect(screen.getAllByRole("link")).toHaveLength(8);
    });

    it.each(NAV_ITEMS)('$label links to $route', async ({ label, route }) => {
      await renderSidebarAt("/dashboard");
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", route);
    });
  });

  describe("active state", () => {
    it("Dashboard is highlighted on /dashboard", async () => {
      await renderSidebarAt("/dashboard");
      expect(screen.getByRole("link", { name: "Dashboard" })).toHaveClass("bg-surface-container");
    });

    it("Sessions is highlighted on /sessions", async () => {
      await renderSidebarAt("/sessions");
      expect(screen.getByRole("link", { name: "Sessions" })).toHaveClass("bg-surface-container");
    });

    it("Sessions is highlighted on /sessions/abc — prefix match", async () => {
      await renderSidebarAt("/sessions/abc");
      expect(screen.getByRole("link", { name: "Sessions" })).toHaveClass("bg-surface-container");
    });

    it("Proposals is highlighted on /proposals/xyz — prefix match", async () => {
      await renderSidebarAt("/proposals/xyz");
      expect(screen.getByRole("link", { name: "Proposals" })).toHaveClass("bg-surface-container");
    });

    it("exactly one item is active at a time on /dashboard", async () => {
      await renderSidebarAt("/dashboard");
      expect(document.querySelectorAll("a.bg-surface-container")).toHaveLength(1);
    });
  });

  describe("no-op on active item", () => {
    it("clicking the active nav item leaves pathname unchanged", async () => {
      const router = await renderSidebarAt("/dashboard");
      fireEvent.click(screen.getByRole("link", { name: "Dashboard" }));
      expect(router.state.location.pathname).toBe("/dashboard");
    });
  });

  describe("collapse", () => {
    it("has a toggle button at the bottom", async () => {
      await renderSidebarAt("/dashboard");
      expect(screen.getByRole("button", { name: /toggle sidebar/i })).toBeInTheDocument();
    });

    it("clicking toggle hides all nav labels", async () => {
      await renderSidebarAt("/dashboard");
      fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
      NAV_ITEMS.forEach(({ label }) => {
        expect(screen.queryByText(label)).not.toBeInTheDocument();
      });
    });

    it("nav links remain in DOM when collapsed", async () => {
      await renderSidebarAt("/dashboard");
      fireEvent.click(screen.getByRole("button", { name: /toggle sidebar/i }));
      expect(screen.getAllByRole("link")).toHaveLength(8);
    });

    it("clicking toggle again restores all nav labels", async () => {
      await renderSidebarAt("/dashboard");
      const toggle = screen.getByRole("button", { name: /toggle sidebar/i });
      fireEvent.click(toggle);
      fireEvent.click(toggle);
      NAV_ITEMS.forEach(({ label }) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });
});

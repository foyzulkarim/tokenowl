import { routeTree } from "@/routeTree.gen";
import { useUIStore } from "@/store/ui";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";

beforeEach(() => {
  localStorage.clear();
  useUIStore.setState({ sidebarCollapsed: false });
});

async function renderAt(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history });
  await router.load();
  render(<RouterProvider router={router} />);
  return router;
}

describe("routing", () => {
  describe("redirect", () => {
    it("/ redirects to /dashboard", async () => {
      const router = await renderAt("/");
      expect(router.state.location.pathname).toBe("/dashboard");
      expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    });
  });

  describe("route rendering", () => {
    const routes = [
      { path: "/dashboard", heading: "Dashboard" },
      { path: "/sessions", heading: "Sessions" },
      { path: "/sessions/test-id", heading: "Session Detail" },
      { path: "/proposals", heading: "Proposals" },
      { path: "/proposals/test-id", heading: "Proposal Detail" },
      { path: "/patterns", heading: "Patterns" },
      { path: "/effectiveness", heading: "Effectiveness" },
      { path: "/chat", heading: "Chat" },
      { path: "/runs", heading: "Runs" },
      { path: "/settings", heading: "Settings" },
    ];

    it.each(routes)('$path renders "$heading" heading', async ({ path, heading }) => {
      await renderAt(path);
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    });
  });

  describe("stress-test", () => {
    it("/sessions/unknown-id renders Session Detail with no crash", async () => {
      await renderAt("/sessions/unknown-id");
      expect(screen.getByRole("heading", { name: "Session Detail" })).toBeInTheDocument();
    });
  });

  describe("regression guard", () => {
    it("src/main.tsx is untouched — no router imports", async () => {
      const { readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");
      const content = readFileSync(resolve(__dirname, "../../main.tsx"), "utf-8");
      expect(content).not.toContain("@tanstack/react-router");
      expect(content).not.toContain("routeTree");
      expect(content).not.toContain("RouterProvider");
      expect(content).toContain("<App />");
    });
  });
});

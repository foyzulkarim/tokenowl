import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Outlet, createRootRoute } from "@tanstack/react-router";

function RootLayout() {
  return (
    <div className="flex flex-col h-screen bg-surface text-on-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-primary focus:text-on-primary"
      >
        Skip to main content
      </a>
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main id="main-content" aria-label="Main content" className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});

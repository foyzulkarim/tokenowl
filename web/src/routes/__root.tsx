import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export const Route = createRootRoute({
  component: () => (
    <div className="flex flex-col h-screen bg-surface text-on-surface">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  ),
});

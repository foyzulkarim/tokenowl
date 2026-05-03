import { useUIStore } from "@/store/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart2,
  Bot,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Play,
  Settings,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MAIN_NAV = [
  { label: "Dashboard", route: "/dashboard", Icon: LayoutDashboard },
  { label: "Sessions", route: "/sessions", Icon: MessageSquare },
  { label: "Proposals", route: "/proposals", Icon: Lightbulb },
  { label: "Patterns", route: "/patterns", Icon: TrendingUp },
  { label: "Effectiveness", route: "/effectiveness", Icon: BarChart2 },
  { label: "Chat", route: "/chat", Icon: Bot },
  { label: "Runs", route: "/runs", Icon: Play },
] as const;

const BOTTOM_NAV = [{ label: "Settings", route: "/settings", Icon: Settings }] as const;

function NavLink({
  label,
  route,
  Icon,
  isActive,
  collapsed,
}: {
  label: string;
  route: string;
  Icon: LucideIcon;
  isActive: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      to={route}
      aria-label={label}
      className={
        isActive
          ? "flex items-center gap-3 px-3 py-2 border-l-2 border-primary-container bg-surface-container-high text-on-surface font-medium focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          : "flex items-center gap-3 px-3 py-2 border-l-2 border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      }
    >
      <Icon size={16} aria-hidden />
      {!collapsed && <span className="text-body-base truncate">{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={`flex flex-col shrink-0 transition-[width] duration-200 ${sidebarCollapsed ? "w-10" : "w-[240px]"} bg-surface-container-low border-r border-outline-variant`}
    >
      <nav aria-label="Main" className="flex flex-col flex-1 py-2">
        {MAIN_NAV.map(({ label, route, Icon }) => (
          <NavLink
            key={route}
            label={label}
            route={route}
            Icon={Icon}
            isActive={pathname === route || pathname.startsWith(`${route}/`)}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>
      <div className="border-t border-outline-variant py-2">
        {BOTTOM_NAV.map(({ label, route, Icon }) => (
          <NavLink
            key={route}
            label={label}
            route={route}
            Icon={Icon}
            isActive={pathname === route || pathname.startsWith(`${route}/`)}
            collapsed={sidebarCollapsed}
          />
        ))}
        <button
          type="button"
          aria-label="Toggle sidebar"
          aria-expanded={!sidebarCollapsed}
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 text-on-surface-variant hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        >
          {sidebarCollapsed ? (
            <ChevronRight size={16} aria-hidden />
          ) : (
            <ChevronLeft size={16} aria-hidden />
          )}
        </button>
      </div>
    </aside>
  );
}

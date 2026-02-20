import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Users, BarChart3, TrendingUp } from "lucide-react";

const navItems = [
  { to: "/kanban", label: "Kanban", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <TrendingUp className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-accent-foreground">PropTech CRM</p>
          <p className="text-xs text-sidebar-foreground">Pipeline Comercial</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground opacity-60">
          Módulos
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground opacity-50">Sistema Interno v1.0</p>
      </div>
    </aside>
  );
}

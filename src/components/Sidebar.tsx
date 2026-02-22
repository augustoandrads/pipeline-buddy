import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LayoutDashboard, Users, BarChart3, TrendingUp, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/kanban", label: "Kanban", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

/**
 * Navigation content shared between desktop sidebar and mobile drawer
 */
function NavigationContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <TrendingUp className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-accent-foreground">CRM Lead2Sales</p>
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
            onClick={onNavigate}
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
    </>
  );
}

/**
 * Mobile drawer navigation
 */
function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed left-4 top-4 z-40"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0 bg-sidebar">
        <div className="flex h-full flex-col">
          <NavigationContent onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Desktop sidebar navigation
 */
function DesktopSidebar() {
  return (
    <aside className="hidden md:flex h-screen w-60 flex-shrink-0 flex-col bg-sidebar">
      <div className="flex h-full flex-col">
        <NavigationContent />
      </div>
    </aside>
  );
}

/**
 * Responsive sidebar component
 * - Desktop (md): Fixed sidebar (240px)
 * - Mobile (<md): Hamburger menu with drawer
 */
export function Sidebar() {
  const isMobile = useIsMobile();

  return (
    <>
      <DesktopSidebar />
      {isMobile && <MobileSidebar />}
    </>
  );
}

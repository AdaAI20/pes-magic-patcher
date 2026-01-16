import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Shield,
  Trophy,
  FileDown,
  FileUp,
  FolderOpen,
  Package,
  Shirt,
  CircleDot,
  UserCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Users, label: "Players", path: "/players" },
  { icon: Shield, label: "Teams", path: "/teams" },
  { icon: Trophy, label: "Leagues", path: "/leagues" },
];

const assetNavItems: NavItem[] = [
  { icon: UserCircle, label: "Faces", path: "/faces" },
  { icon: Shirt, label: "Kits", path: "/kits" },
  { icon: CircleDot, label: "Balls", path: "/balls" },
];

const toolsNavItems: NavItem[] = [
  { icon: FileDown, label: "Import", path: "/import" },
  { icon: FileUp, label: "Export", path: "/export" },
  { icon: Package, label: "Patch Builder", path: "/patch-builder" },
  { icon: FolderOpen, label: "File Browser", path: "/file-browser" },
];

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
          isActive
            ? "bg-primary/15 text-primary border border-primary/30"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        )}
      >
        <Icon
          className={cn(
            "w-5 h-5 shrink-0 transition-colors",
            isActive ? "text-primary" : "group-hover:text-primary"
          )}
        />
        {!collapsed && (
          <span className="font-medium text-sm">{item.label}</span>
        )}
        {isActive && !collapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </Link>
    );
  };

  const NavSection = ({
    title,
    items,
  }: {
    title: string;
    items: NavItem[];
  }) => (
    <div className="space-y-1">
      {!collapsed && (
        <h3 className="px-3 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">
          {title}
        </h3>
      )}
      {items.map((item) => (
        <NavLink key={item.path} item={item} />
      ))}
    </div>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-primary-foreground text-lg">
              PE
            </span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display font-bold text-lg text-foreground leading-tight">
                PES Editor
              </h1>
              <p className="text-xs text-muted-foreground">2021 Pro</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        <NavSection title="Main" items={mainNavItems} />
        <NavSection title="Assets" items={assetNavItems} />
        <NavSection title="Tools" items={toolsNavItems} />
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Settings</span>}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

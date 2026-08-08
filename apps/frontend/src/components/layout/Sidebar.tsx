import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, ArrowLeftRight, Users, FileText, ShieldCheck, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, hasRole } from "@/stores/auth.store";
import { Role } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[]; // si absent, visible par tous les rôles authentifiés
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/produits", label: "Produits", icon: Package, roles: ["admin", "vendeur"] },
  { to: "/stock/mouvements", label: "Mouvements de stock", icon: ArrowLeftRight, roles: ["admin", "vendeur"] },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/factures", label: "Factures", icon: FileText },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
    isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
  );

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-semibold">StockFlow</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.filter((item) => !item.roles || hasRole(user?.role, ...item.roles)).map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}

        {user?.isPlatformOwner && (
          <>
            <div className="my-2 border-t border-border pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Plateforme
            </div>
            <NavLink to="/admin" className={navLinkClass}>
              <ShieldCheck className="h-4 w-4" />
              Administration
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 px-3 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">{user?.email}</div>
          <div className="capitalize">{user?.role}</div>
        </div>
        <button
          onClick={clearSession}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

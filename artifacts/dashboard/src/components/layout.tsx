import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Database, LayoutDashboard, Settings } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/activity", label: "Activity Log", icon: Activity },
    { href: "/memory", label: "Memory", icon: Database },
    { href: "/config", label: "Configuration", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold tracking-tighter">
            NX
          </div>
          <div className="font-bold text-lg tracking-tight">NEXUS TRADE</div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}

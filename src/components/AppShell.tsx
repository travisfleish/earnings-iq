import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LineChart, Search, Star, GitCompareArrows, FileText, Settings, Menu, X, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home", icon: LineChart },
  { to: "/search", label: "Search", icon: Search },
  { to: "/chat", label: "Eve Chat", icon: MessagesSquare },
  { to: "/watchlist", label: "Watchlist", icon: Star },
  { to: "/compare", label: "Compare", icon: GitCompareArrows },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-border bg-[color:var(--surface)] md:w-60 md:sticky md:top-0 md:h-screen shrink-0",
          open ? "block" : "hidden md:block",
        )}
      >
        <div className="px-5 h-16 flex items-center gap-2 border-b border-border">
          <div className="h-8 w-8 rounded-md bg-primary/15 text-primary flex items-center justify-center font-semibold">
            EQ
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">Earnings IQ</div>
            <div className="text-[11px] text-muted-foreground mt-1">Investor intelligence</div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border flex items-center gap-3 px-4 md:px-8 bg-background/80 backdrop-blur sticky top-0 z-20">
          <button
            className="md:hidden p-2 rounded hover:bg-accent"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-sm text-muted-foreground">
            Earnings intelligence for public companies
          </div>
          <div className="ml-auto text-xs text-muted-foreground hidden sm:block">
            Demo data · Ready to connect real APIs
          </div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

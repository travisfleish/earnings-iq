"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LineChart, Search, Star, GitCompareArrows, FileText, Settings, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home", icon: LineChart },
  { to: "/search", label: "Search", icon: Search },
  { to: "/watchlist", label: "Watchlist", icon: Star },
  { to: "/compare", label: "Compare", icon: GitCompareArrows },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-snow">
      <header className="h-16 flex items-center gap-4 px-4 md:px-8 bg-snow sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Logo variant="marque" color="blue" className="h-8 w-auto" />
          <span className="hidden sm:block font-heading text-sm font-medium text-navy leading-none tracking-tight">
            Earnings IQ
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  href={n.to}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-body transition-colors duration-300",
                    active
                      ? "bg-lightGrey text-navy font-medium"
                      : "text-muted-foreground hover:bg-lightGrey/60 hover:text-navy",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <button
            className="lg:hidden p-2 rounded-full hover:bg-lightGrey text-navy"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {open && (
        <nav className="lg:hidden border-b border-lavenderGrey bg-white px-4 py-3 space-y-1">
          {nav.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                href={n.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-body transition-colors duration-300",
                  active
                    ? "bg-lightGrey text-navy font-medium"
                    : "text-muted-foreground hover:bg-lightGrey/60 hover:text-navy",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      )}

      <main className="flex-1 min-w-0 bg-snow">{children}</main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { BrandButton } from "@/components/brand/BrandButton";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

const GENIUS_INVESTOR_SITE_URL = "https://investors.geniussports.com";

const nav = [
  { to: "/search", label: "Search" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/compare", label: "Compare" },
  { to: "/reports", label: "Reports" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-snow">
      <header className="min-h-16 pt-2 md:pt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-8 bg-snow sticky top-0 z-20">
        <Link href="/" className="flex items-center shrink-0 justify-self-start">
          <Logo variant="horizontal" color="blue" className="h-12 w-auto md:h-14" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1 justify-self-center">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                href={n.to}
                className={cn(
                  "px-3 py-2 rounded-full text-sm font-heading transition-colors duration-300",
                  active
                    ? "bg-lightGrey text-navy font-medium"
                    : "text-muted-foreground hover:bg-lightGrey/60 hover:text-navy",
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 justify-self-end">
          <a
            href={GENIUS_INVESTOR_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex shrink-0"
          >
            <BrandButton
              link={{ title: "Visit Genius Investor Site", url: GENIUS_INVESTOR_SITE_URL }}
              button={{ type: "header", background_color: "lavenderGrey" }}
            />
          </a>
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
          <a
            href={GENIUS_INVESTOR_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex sm:hidden mb-2"
          >
            <BrandButton
              link={{ title: "Visit Genius Investor Site", url: GENIUS_INVESTOR_SITE_URL }}
              button={{ type: "header", background_color: "lavenderGrey" }}
            />
          </a>
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                href={n.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-3 py-2.5 rounded-full text-sm font-heading transition-colors duration-300",
                  active
                    ? "bg-lightGrey text-navy font-medium"
                    : "text-muted-foreground hover:bg-lightGrey/60 hover:text-navy",
                )}
              >
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

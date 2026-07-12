"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function TickerSearch({ size = "md", autoFocus = false }: { size?: "md" | "lg"; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim().toUpperCase();
    if (!t) return;
    router.push(`/company/${t}`);
  };
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-lavenderGrey bg-white px-4 shadow-sm focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/10 transition-all duration-300",
          size === "lg" ? "h-16" : "h-12",
        )}
      >
        <Search className={cn("text-muted-foreground", size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter a ticker (e.g. NVDA, AAPL, MSFT, AMZN)"
          className={cn(
            "flex-1 bg-transparent outline-none placeholder:text-muted-foreground tabular font-body",
            size === "lg" ? "text-lg" : "text-sm",
          )}
        />
        <button
          type="submit"
          className={cn(
            "rounded-full bg-blue text-white font-medium font-body hover:bg-navy transition-colors duration-300",
            size === "lg" ? "px-6 py-2.5 text-sm" : "px-4 py-1.5 text-xs",
          )}
        >
          Analyze
        </button>
      </div>
    </form>
  );
}

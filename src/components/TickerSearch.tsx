import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function TickerSearch({ size = "md", autoFocus = false }: { size?: "md" | "lg"; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim().toUpperCase();
    if (!t) return;
    navigate({ to: "/company/$ticker", params: { ticker: t } });
  };
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border bg-card px-4",
          size === "lg" ? "h-16" : "h-12",
        )}
      >
        <Search className={cn("text-muted-foreground", size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter a ticker (e.g. NVDA, AAPL, GENI, SRAD, TTD)"
          className={cn(
            "flex-1 bg-transparent outline-none placeholder:text-muted-foreground tabular",
            size === "lg" ? "text-lg" : "text-sm",
          )}
        />
        <button
          type="submit"
          className={cn(
            "rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition",
            size === "lg" ? "px-5 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
          )}
        >
          Analyze
        </button>
      </div>
    </form>
  );
}

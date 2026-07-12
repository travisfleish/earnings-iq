import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useWatchlist } from "@/hooks/useWatchlist";
import { getMockAnalysis } from "@/lib/mockData";
import { PriceDelta } from "@/components/SentimentBadge";
import { Star } from "lucide-react";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — Earnings IQ" },
      { name: "description", content: "Your saved companies and their latest earnings intelligence." },
    ],
  }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { list, hydrated, remove } = useWatchlist();

  return (
    <AppShell>
      <div className="px-4 md:px-8 py-10 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold">Watchlist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Companies you've saved for quick access.
        </p>

        {!hydrated ? (
          <div className="mt-8 text-sm text-muted-foreground">Loading…</div>
        ) : list.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
            <Star className="h-6 w-6 mx-auto text-muted-foreground" />
            <div className="mt-3 font-medium">No saved tickers yet</div>
            <p className="text-sm text-muted-foreground mt-1">
              Open a company dashboard and hit the star to save it here.
            </p>
            <Link
              to="/search"
              className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Search a ticker
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((t) => {
              const a = getMockAnalysis(t);
              return (
                <div key={t} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold tabular">{t}</div>
                      <div className="text-xs text-muted-foreground">
                        {a?.profile.name ?? "Not in demo dataset"}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(t)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </button>
                  </div>
                  {a && (
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-semibold tabular">
                          ${a.profile.price.toFixed(2)}
                        </div>
                        <PriceDelta value={a.profile.changePct} />
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{a.profile.earningsQuarter}</div>
                        <div>PT ${a.priceTarget.average.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                  <Link
                    to="/company/$ticker"
                    params={{ ticker: t }}
                    className="mt-4 inline-flex text-xs text-primary hover:underline"
                  >
                    Open dashboard →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

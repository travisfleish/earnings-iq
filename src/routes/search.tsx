import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TickerSearch } from "@/components/TickerSearch";
import { getSupportedTickers } from "@/lib/mockData";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search tickers — Earnings IQ" },
      { name: "description", content: "Search for any public-company ticker to load its earnings intelligence dashboard." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const tickers = getSupportedTickers();
  return (
    <AppShell>
      <div className="px-4 md:px-8 py-10 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter any public-company ticker to load its earnings dashboard.
        </p>
        <div className="mt-6">
          <TickerSearch size="lg" autoFocus />
        </div>
        <div className="mt-10">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Popular tickers
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {tickers.map((t) => (
              <Link
                key={t.ticker}
                to="/company/$ticker"
                params={{ ticker: t.ticker }}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/50 transition"
              >
                <div>
                  <div className="font-medium tabular">{t.ticker}</div>
                  <div className="text-xs text-muted-foreground">{t.name}</div>
                </div>
                <span className="text-xs text-muted-foreground">{t.sector}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

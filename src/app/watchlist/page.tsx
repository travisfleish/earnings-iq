"use client";

import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { useWatchlist } from "@/hooks/useWatchlist";
import { fetchAnalysis, fetchLiveQuote } from "@/lib/actions";
import { PriceDelta } from "@/components/SentimentBadge";
import { Star } from "lucide-react";

function WatchlistCard({ ticker, onRemove }: { ticker: string; onRemove: () => void }) {
  const [{ data: analysis, isLoading }, { data: quote }] = useQueries({
    queries: [
      {
        queryKey: ["analysis", ticker],
        queryFn: () => fetchAnalysis({ ticker }),
        staleTime: 60 * 60 * 1000,
      },
      {
        queryKey: ["live-quote", ticker],
        queryFn: () => fetchLiveQuote({ ticker }),
        staleTime: 30_000,
      },
    ],
  });

  const price = quote?.price ?? analysis?.profile.price;
  const changePct = quote?.changePct ?? analysis?.profile.changePct;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold tabular">{ticker}</div>
          <div className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : (analysis?.profile.name ?? "Unknown ticker")}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Remove
        </button>
      </div>
      {analysis && price != null && (
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-2xl font-semibold tabular">${price.toFixed(2)}</div>
            {changePct != null && <PriceDelta value={changePct} />}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>{analysis.profile.earningsQuarter}</div>
            <div>PT ${analysis.priceTarget.average.toFixed(2)}</div>
          </div>
        </div>
      )}
      <Link
        href={`/company/${ticker}`}
        className="mt-4 inline-flex text-xs text-primary hover:underline"
      >
        Open dashboard →
      </Link>
    </div>
  );
}

export default function WatchlistPage() {
  const { list, hydrated, remove } = useWatchlist();

  return (
    <AppShell>
      <div className="px-4 md:px-8 py-10 max-w-6xl mx-auto">
        <PageHero>
          <h1 className="text-2xl font-semibold">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Companies you&apos;ve saved for quick access.
          </p>
        </PageHero>

        {!hydrated ? (
          <div className="mt-8 text-sm text-muted-foreground">Loading…</div>
        ) : list.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
            <Star className="h-6 w-6 mx-auto text-muted-foreground" />
            <div className="mt-3 font-medium">No saved tickers yet</div>
            <p className="text-sm text-muted-foreground mt-1">
              Open a company dashboard and use &ldquo;Add to Watchlist&rdquo; to save it here.
            </p>
            <Link
              href="/search"
              className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Search a ticker
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((t) => (
              <WatchlistCard key={t} ticker={t} onRemove={() => remove(t)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

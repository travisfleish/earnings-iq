import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getMockAnalysis, getSupportedTickers } from "@/lib/mockData";
import { useState } from "react";
import { PriceDelta, SentimentBadge } from "@/components/SentimentBadge";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare companies — Earnings IQ" },
      { name: "description", content: "Compare price, analyst targets, and earnings sentiment across companies." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const supported = getSupportedTickers();
  const [selected, setSelected] = useState<string[]>(["NVDA", "AAPL"]);

  const toggle = (t: string) =>
    setSelected((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 4 ? [...prev, t] : prev,
    );

  const rows = selected
    .map((t) => getMockAnalysis(t))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <AppShell>
      <div className="px-4 md:px-8 py-10 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold">Compare companies</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick up to 4 tickers to compare side-by-side.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {supported.map((t) => {
            const on = selected.includes(t.ticker);
            return (
              <button
                key={t.ticker}
                onClick={() => toggle(t.ticker)}
                className={
                  "px-3 py-1.5 rounded-md text-xs border tabular transition " +
                  (on
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50")
                }
              >
                {t.ticker}
              </button>
            );
          })}
        </div>

        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--surface)] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">Chg %</th>
                <th className="text-right px-4 py-3 font-medium">Avg PT</th>
                <th className="text-right px-4 py-3 font-medium">Upside</th>
                <th className="text-left px-4 py-3 font-medium">Rating</th>
                <th className="text-left px-4 py-3 font-medium">Sentiment</th>
                <th className="text-left px-4 py-3 font-medium">Quarter</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const upside = ((a.priceTarget.average - a.profile.price) / a.profile.price) * 100;
                const sent = a.sentimentScore >= 25 ? "positive" : a.sentimentScore <= -25 ? "negative" : "neutral";
                return (
                  <tr key={a.profile.ticker} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium tabular">{a.profile.ticker}</div>
                      <div className="text-xs text-muted-foreground">{a.profile.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular">${a.profile.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right"><PriceDelta value={a.profile.changePct} /></td>
                    <td className="px-4 py-3 text-right tabular">${a.priceTarget.average.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right"><PriceDelta value={upside} /></td>
                    <td className="px-4 py-3">{a.priceTarget.rating}</td>
                    <td className="px-4 py-3"><SentimentBadge sentiment={sent} label={`${a.sentimentScore > 0 ? "+" : ""}${a.sentimentScore}`} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{a.profile.earningsQuarter}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Select tickers above to compare.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

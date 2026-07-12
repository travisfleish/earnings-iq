import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { TickerSearch } from "@/components/TickerSearch";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { getSupportedTickers } from "@/lib/mockData";
import { Sparkles, TrendingUp, MessagesSquare, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Earnings IQ — Instant earnings intelligence for any ticker" },
      {
        name: "description",
        content:
          "Enter any public-company ticker and get an executive-grade earnings dashboard: call summary, themes, analyst sentiment, price targets, and more.",
      },
      { property: "og:title", content: "Earnings IQ — Instant earnings intelligence" },
      {
        property: "og:description",
        content:
          "Executive-grade earnings dashboards for any public company. Themes, sentiment, analyst targets, and quarter-over-quarter comparison.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const tickers = getSupportedTickers();
  return (
    <AppShell>
      <section className="px-4 md:px-8 pt-16 pb-12 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground mb-6">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI-powered earnings intelligence
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          One ticker in.
          <br />
          <span className="text-primary">A full earnings brief out.</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
          Enter any public-company ticker to get an executive-grade earnings dashboard — the
          Earnings IQ Scorecard, call summary, key themes, bull/bear cases, analyst sentiment,
          and quarter-over-quarter changes.
        </p>
        <div className="mt-8 max-w-2xl">
          <TickerSearch size="lg" autoFocus />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Popular:</span>
            {tickers.map((t) => (
              <Link
                key={t.ticker}
                to="/company/$ticker"
                params={{ ticker: t.ticker }}
                className="px-2.5 py-1 rounded-md border border-border hover:border-primary/50 hover:text-primary transition"
              >
                {t.ticker}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-8 pb-16 max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
        {[
          {
            icon: TrendingUp,
            title: "Price + analyst targets",
            body: "Current price, average/high/low analyst targets, implied upside, and rating consensus at a glance.",
          },
          {
            icon: MessagesSquare,
            title: "Themes, quotes & Q&A",
            body: "Top themes with sentiment, notable quotes, and what analysts pushed on during Q&A.",
          },
          {
            icon: BarChart3,
            title: "Quarter-over-quarter",
            body: "New vs recurring vs fading themes, KPI deltas, guidance language changes, sentiment drift.",
          },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-5">
            <f.icon className="h-5 w-5 text-primary" />
            <div className="mt-4 font-medium">{f.title}</div>
            <div className="mt-1.5 text-sm text-muted-foreground">{f.body}</div>
          </div>
        ))}
      </section>

      <section className="px-4 md:px-8 pb-20 max-w-4xl mx-auto">
        <NewsletterSignup />
      </section>
    </AppShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { DotSubheading } from "@/components/brand/DotSubheading";
import { EveChat } from "@/components/eve/EveChat";
import { TickerSearch } from "@/components/TickerSearch";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { getSupportedTickers } from "@/lib/mockData";
import { TrendingUp, MessagesSquare, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Earnings IQ — Instant earnings intelligence for any ticker",
  description:
    "Enter any public-company ticker and get an executive-grade earnings dashboard: call summary, themes, analyst sentiment, price targets, and more.",
  openGraph: {
    title: "Earnings IQ — Instant earnings intelligence",
    description:
      "Executive-grade earnings dashboards for any public company. Themes, sentiment, analyst targets, and quarter-over-quarter comparison.",
    type: "website",
  },
};

export default function HomePage() {
  const tickers = getSupportedTickers();
  return (
    <AppShell>
      <section className="px-4 md:px-8 pt-16 md:pt-20 pb-10 max-w-4xl mx-auto text-center">
        <DotSubheading color="brightGreen">AI-powered earnings intelligence</DotSubheading>
        <h1 className="mt-6 text-h1 font-heading text-navy">
          One ticker in.
          <br />
          <span className="text-blue">A full earnings brief out.</span>
        </h1>
        <p className="mt-5 font-body text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Ask GeniusAI about earnings themes, sentiment, and analyst targets — or jump straight to a
          full dashboard for any public company.
        </p>

        <div className="mt-10 max-w-2xl mx-auto">
          <TickerSearch size="lg" />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground font-body">
            <span>Popular:</span>
            {tickers.map((t) => (
              <Link
                key={t.ticker}
                href={`/company/${t.ticker}`}
                className="px-3 py-1 rounded-full border border-lavenderGrey bg-white hover:border-blue hover:text-blue transition-colors duration-300"
              >
                {t.ticker}
              </Link>
            ))}
          </div>
        </div>

        <div id="geniusai" className="mt-14 max-w-3xl mx-auto text-left">
          <EveChat variant="hero" />
        </div>
      </section>

      <section className="px-4 md:px-8 pb-16 pt-14 max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
        {[
          {
            icon: TrendingUp,
            accent: "bg-blue",
            title: "Price + analyst targets",
            body: "Current price, average/high/low analyst targets, implied upside, and rating consensus at a glance.",
          },
          {
            icon: MessagesSquare,
            accent: "bg-brightGreen",
            title: "Themes, quotes & Q&A",
            body: "Top themes with sentiment, notable quotes, and what analysts pushed on during Q&A.",
          },
          {
            icon: BarChart3,
            accent: "bg-lightBlue",
            title: "Quarter-over-quarter",
            body: "New vs recurring vs fading themes, KPI deltas, guidance language changes, sentiment drift.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-lavenderGrey bg-white px-6 py-8 hover:border-blue/30 transition-colors duration-300"
          >
            <div className={`h-0.5 w-8 ${f.accent} mb-5`} />
            <f.icon className="h-5 w-5 text-navy" />
            <div className="mt-4 font-heading text-lg font-light tracking-tight text-navy">
              {f.title}
            </div>
            <div className="mt-2 font-body text-sm text-muted-foreground leading-relaxed">
              {f.body}
            </div>
          </div>
        ))}
      </section>

      <section className="px-4 md:px-8 pb-20 max-w-4xl mx-auto">
        <NewsletterSignup />
      </section>
    </AppShell>
  );
}

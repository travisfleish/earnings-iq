"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { PodcastPlayer } from "@/components/company/PodcastPlayer";
import { fetchAnalysis, fetchLiveQuote, fetchScorecard, type LiveQuote } from "@/lib/actions";
import { ScorecardCard, ScorecardSkeleton } from "@/components/ScorecardCard";
import { getIRLinks } from "@/lib/services/ir";
import { PriceDelta, SentimentBadge } from "@/components/SentimentBadge";
import { useWatchlist } from "@/hooks/useWatchlist";
import {
  Star,
  RefreshCw,
  Download,
  Copy,
  Check,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Radio,
  FileText,
  Video,
  Presentation,
  Newspaper,
  ExternalLink,
  Landmark,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { EarningsAnalysis } from "@/lib/types";

export function CompanyDashboard({ ticker }: { ticker: string }) {
  const upper = ticker.toUpperCase();
  const router = useRouter();
  const { has, toggle, hydrated } = useWatchlist();

  const {
    data: baseAnalysis,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["analysis", upper],
    queryFn: () => fetchAnalysis({ ticker: upper }),
    staleTime: 60 * 60 * 1000,
  });

  const { data: scorecard, isLoading: isScorecardLoading } = useQuery({
    queryKey: ["scorecard", upper, baseAnalysis?.sentimentScore],
    enabled: !!baseAnalysis,
    staleTime: 60 * 60 * 1000,
    queryFn: () =>
      fetchScorecard({
        ticker: upper,
        companyName: baseAnalysis?.profile.name,
        sector: baseAnalysis?.profile.sector,
        callSummary: baseAnalysis?.callSummary,
        themes: baseAnalysis?.themes.map((t) => t.title) ?? [],
        sentimentScore: baseAnalysis?.sentimentScore,
      }),
  });

  const {
    data: liveQuote,
    refetch: refetchQuote,
    isFetching: isFetchingQuote,
    dataUpdatedAt: quoteUpdatedAt,
  } = useQuery({
    queryKey: ["live-quote", upper],
    queryFn: () => fetchLiveQuote({ ticker: upper }),
    refetchInterval: 60_000, // refresh every minute
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const data = useMemo(
    () => mergeLiveQuote(baseAnalysis ?? null, liveQuote ?? null),
    [baseAnalysis, liveQuote],
  );

  const refreshAll = () => {
    refetch();
    refetchQuote();
  };

  if (isLoading) {
    return (
      <AppShell>
        <LoadingState ticker={upper} />
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <ConnectApiState
          ticker={upper}
          liveQuote={liveQuote ?? null}
          onBack={() => router.push("/search")}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/search" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to search
          </Link>
          <div className="flex items-center gap-2">
            <LiveIndicator
              quote={liveQuote ?? null}
              isFetching={isFetchingQuote}
              lastUpdatedAt={quoteUpdatedAt}
            />
            <button
              onClick={refreshAll}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", (isFetching || isFetchingQuote) && "animate-spin")} /> Refresh
            </button>
            <PodcastPlayer ticker={upper} />
            <ExportButton analysis={data} />
            <button
              onClick={() => toggle(upper)}
              disabled={!hydrated}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition",
                has(upper)
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border hover:bg-accent",
              )}
            >
              <Star className={cn("h-3.5 w-3.5", has(upper) && "fill-current")} />
              {has(upper) ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        <HeaderCard a={data} liveQuote={liveQuote ?? null} />

        {scorecard ? (
          <ScorecardCard scorecard={scorecard} />
        ) : isScorecardLoading ? (
          <ScorecardSkeleton />
        ) : null}

        <IRLinksBar ticker={data.profile.ticker} companyName={data.profile.name} />

        <div className="grid lg:grid-cols-3 gap-6">
          <PriceTargetCard a={data} />
          <ReactionCard a={data} />
          <SentimentCard a={data} />
        </div>

        <CallSummaryCard a={data} />
        <ThemesGrid a={data} />

        <div className="grid lg:grid-cols-2 gap-6">
          <NarrativeCard a={data} />
          <QACard a={data} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <BullBearCard title="Bull case" tone="bull" a={data.bull} />
          <BullBearCard title="Bear case" tone="bear" a={data.bear} />
        </div>

        <QoQCard a={data} />
        <MetricsTable a={data} />
        <QuotesCard a={data} />
        <WatchlistNextQuarter a={data} />
      </div>
    </AppShell>
  );
}

const ANALYSIS_LOADING_STEPS = [
  "Fetching current price and daily change",
  "Loading analyst price targets and consensus",
  "Retrieving latest earnings call transcript",
  "Comparing with prior 3 quarters",
  "Extracting themes, quotes, and sentiment",
] as const;

const STEP_THRESHOLDS = [0, 15, 32, 52, 72, 92];

function useSimulatedLoadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const tick = () => {
      const elapsed = Date.now() - started;
      const base = 94 * (1 - Math.exp(-elapsed / 14_000));
      const creep = elapsed > 20_000 ? Math.min(4, (elapsed - 20_000) / 8_000) : 0;
      setProgress(Math.min(98, Math.round(base + creep)));
    };
    tick();
    const id = setInterval(tick, 120);
    return () => clearInterval(id);
  }, []);

  let activeIndex = 0;
  for (let i = STEP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (progress >= STEP_THRESHOLDS[i]) {
      activeIndex = Math.min(i, ANALYSIS_LOADING_STEPS.length - 1);
      break;
    }
  }

  return { progress, activeIndex };
}

function LoadingState({ ticker }: { ticker: string }) {
  const { progress, activeIndex } = useSimulatedLoadingProgress();

  return (
    <div className="px-4 md:px-8 py-16 max-w-3xl mx-auto text-center">
      <div className="animate-pulse text-primary font-semibold text-2xl tabular">{ticker}</div>
      <div className="mt-3 text-sm text-muted-foreground">Analyzing latest earnings…</div>
      <div className="mt-8 max-w-md mx-auto space-y-4">
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="grid gap-2 text-left text-xs">
          {ANALYSIS_LOADING_STEPS.map((s, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            return (
              <div
                key={s}
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  done && "text-muted-foreground/70",
                  active && "text-foreground",
                  !done && !active && "text-muted-foreground/50",
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5 text-[color:var(--bull)] shrink-0" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted shrink-0" />
                )}
                {s}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConnectApiState({
  ticker,
  liveQuote,
  onBack,
}: {
  ticker: string;
  liveQuote: LiveQuote | null;
  onBack: () => void;
}) {
  return (
    <div className="px-4 md:px-8 py-16 max-w-2xl mx-auto text-center">
      <div className="text-primary text-3xl font-semibold tabular">{ticker}</div>
      {liveQuote && (
        <div className="mt-3 tabular">
          <span className="text-2xl font-semibold">${liveQuote.price.toFixed(2)}</span>{" "}
          <PriceDelta value={liveQuote.changePct} />
          <div className="text-[11px] text-muted-foreground mt-1">
            Live quote · {liveQuote.exchangeName ?? "—"} · updated{" "}
            {new Date(liveQuote.regularMarketTime).toLocaleString()}
          </div>
        </div>
      )}
      <h1 className="mt-4 text-2xl font-semibold">We couldn't load a full brief for {ticker}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        The live price is streamed above, but we couldn't pull the earnings narrative for this
        ticker right now. Try one of the tickers below, or head back to search.
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-left text-sm">
        <div className="font-medium mb-2">Popular tickers</div>
        <div className="flex flex-wrap gap-2">
          {["NVDA", "AAPL", "GENI", "SRAD", "TTD"].map((t) => (
            <Link
              key={t}
              href={`/company/${t}`}
              className="px-2.5 py-1 rounded-md border border-border hover:border-primary/50 hover:text-primary text-xs tabular"
            >
              {t}
            </Link>
          ))}
        </div>
      </div>
      <button
        onClick={onBack}
        className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to search
      </button>
    </div>
  );
}

function mergeLiveQuote(
  base: EarningsAnalysis | null,
  quote: LiveQuote | null,
): EarningsAnalysis | null {
  if (!base) return null;
  if (!quote) return base;
  return {
    ...base,
    profile: {
      ...base.profile,
      price: quote.price,
      change: quote.change,
      changePct: quote.changePct,
    },
    priceTarget: { ...base.priceTarget, current: quote.price },
  };
}

function useRelativeTime(ts: number | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);
  if (!ts) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function LiveIndicator({
  quote,
  isFetching,
  lastUpdatedAt,
}: {
  quote: LiveQuote | null;
  isFetching: boolean;
  lastUpdatedAt: number;
}) {
  const rel = useRelativeTime(lastUpdatedAt || null);
  if (!quote) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground px-2 py-1 rounded-md border border-border">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        Live quote unavailable
      </span>
    );
  }
  const live = quote.marketState === "REGULAR";
  return (
    <span
      className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md border"
      style={{
        borderColor: live
          ? "color-mix(in oklab, var(--bull) 40%, transparent)"
          : "var(--border)",
        color: live ? "var(--bull)" : "var(--muted-foreground)",
      }}
      title={`Market: ${quote.marketState} · ${quote.exchangeName ?? ""}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          live ? "bg-[color:var(--bull)] animate-pulse" : "bg-muted-foreground",
          isFetching && "animate-ping",
        )}
      />
      {live ? "Live" : quote.marketState.replace(/_/g, " ").toLowerCase()}
      {rel && <span className="text-muted-foreground">· {rel}</span>}
    </span>
  );
}


function Card({
  title,
  subtitle,
  children,
  className,
  actions,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 md:p-6", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>}
            {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

function HeaderCard({ a, liveQuote }: { a: EarningsAnalysis; liveQuote: LiveQuote | null }) {
  const p = a.profile;
  const priceStamp = liveQuote
    ? new Date(liveQuote.regularMarketTime).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-semibold tabular">{p.ticker}</div>
            <span className="text-xs px-2 py-0.5 rounded-md border border-border text-muted-foreground">
              {p.sector}
            </span>
            {liveQuote?.exchangeName && (
              <span className="text-[11px] px-2 py-0.5 rounded-md border border-border text-muted-foreground">
                {liveQuote.exchangeName}
              </span>
            )}
          </div>
          <div className="mt-1 text-lg text-muted-foreground">{p.name}</div>
          {a.isPreview && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md border border-dashed border-border text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--neutral)]" />
              Fallback analysis · AI Gateway unavailable
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-6 md:gap-10 tabular">
          <Stat label="Price">
            <div className="text-2xl font-semibold flex items-center gap-2">
              ${p.price.toFixed(2)}
              {liveQuote && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border"
                  style={{
                    borderColor:
                      liveQuote.marketState === "REGULAR"
                        ? "color-mix(in oklab, var(--bull) 40%, transparent)"
                        : "var(--border)",
                    color:
                      liveQuote.marketState === "REGULAR"
                        ? "var(--bull)"
                        : "var(--muted-foreground)",
                  }}
                >
                  <Radio className="h-2.5 w-2.5" />
                  {liveQuote.marketState === "REGULAR" ? "Live" : "Last"}
                </span>
              )}
            </div>
            <div className="text-xs mt-0.5">
              <PriceDelta value={p.change} suffix="" /> · <PriceDelta value={p.changePct} />
            </div>
            {priceStamp && (
              <div className="text-[10px] text-muted-foreground mt-1">as of {priceStamp}</div>
            )}
          </Stat>
          <Stat label="Market cap">
            <div className="text-2xl font-semibold">{p.marketCap}</div>
          </Stat>
          <Stat label="Latest quarter">
            <div className="text-2xl font-semibold">{p.earningsQuarter}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Reported {p.earningsDate}</div>
          </Stat>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function PriceTargetCard({ a }: { a: EarningsAnalysis }) {
  const pt = a.priceTarget;
  const upside = ((pt.average - pt.current) / pt.current) * 100;
  const positionPct = Math.max(0, Math.min(100, ((pt.current - pt.low) / (pt.high - pt.low)) * 100));
  const avgPct = Math.max(0, Math.min(100, ((pt.average - pt.low) / (pt.high - pt.low)) * 100));
  return (
    <Card title="Price target" subtitle={`${pt.analysts} analysts · ${pt.rating}`}>
      <div className="tabular">
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-semibold">${pt.average.toFixed(2)}</div>
          <PriceDelta value={upside} />
        </div>
        <div className="text-xs text-muted-foreground mt-1">Average analyst target</div>

        <div className="mt-6 relative h-2 rounded-full bg-muted">
          <div className="absolute top-0 bottom-0 w-0.5 bg-foreground" style={{ left: `${positionPct}%` }} />
          <div className="absolute -top-1 h-4 w-0.5 bg-primary" style={{ left: `${avgPct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>Low ${pt.low.toFixed(2)}</span>
          <span>High ${pt.high.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex justify-between text-[11px]">
          <span className="text-muted-foreground">Current ${pt.current.toFixed(2)}</span>
          <span className="text-primary">Avg ${pt.average.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}

function ReactionCard({ a }: { a: EarningsAnalysis }) {
  const r = a.reaction;
  return (
    <Card title="Earnings reaction">
      <div className="grid grid-cols-3 gap-3 tabular">
        <ReactionStat label="1 day" value={r.oneDay} />
        <ReactionStat label="5 day" value={r.fiveDay} />
        <ReactionStat label="Since" value={r.sinceEarnings} />
      </div>
      <div className="mt-4 text-sm">{r.reasonSummary}</div>
      <div className="mt-3 text-xs text-muted-foreground">{r.marketReaction}</div>
    </Card>
  );
}

function ReactionStat({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 flex items-center gap-1 text-lg font-semibold",
        positive ? "text-[color:var(--bull)]" : "text-[color:var(--bear)]")}>
        <Icon className="h-4 w-4" />
        {positive ? "+" : ""}{value.toFixed(1)}%
      </div>
    </div>
  );
}

function SentimentCard({ a }: { a: EarningsAnalysis }) {
  const s = a.sentimentScore;
  const sent = s >= 25 ? "positive" : s <= -25 ? "negative" : "neutral";
  const pct = Math.round(((s + 100) / 200) * 100);
  return (
    <Card title="Sentiment score">
      <div className="tabular">
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-semibold">{s > 0 ? "+" : ""}{s}</div>
          <SentimentBadge sentiment={sent} />
        </div>
        <div className="text-xs text-muted-foreground mt-1">Composite of call tone, Q&A, and reaction</div>
        <div className="mt-6 relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "absolute top-0 bottom-0",
              sent === "positive" && "bg-[color:var(--bull)]",
              sent === "negative" && "bg-[color:var(--bear)]",
              sent === "neutral" && "bg-[color:var(--neutral)]",
            )}
            style={{ left: pct >= 50 ? "50%" : `${pct}%`, width: `${Math.abs(pct - 50)}%` }}
          />
          <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>-100 Bearish</span>
          <span>Neutral</span>
          <span>+100 Bullish</span>
        </div>
      </div>
    </Card>
  );
}

function CallSummaryCard({ a }: { a: EarningsAnalysis }) {
  return (
    <Card
      title="Earnings call summary"
      actions={<CopyButton text={a.callSummary} label="Copy summary" />}
    >
      <p className="text-sm leading-relaxed">{a.callSummary}</p>
    </Card>
  );
}

function statusColor(status: "new" | "recurring" | "fading") {
  if (status === "new") return "bg-primary/15 text-primary border-primary/30";
  if (status === "recurring") return "bg-muted text-muted-foreground border-border";
  return "bg-[color:var(--neutral)]/15 text-[color:var(--neutral)] border-[color:var(--neutral)]/30";
}

function ThemesGrid({ a }: { a: EarningsAnalysis }) {
  return (
    <Card title="Earnings themes" subtitle={`${a.themes.length} themes surfaced from the call`}>
      <div className="grid md:grid-cols-2 gap-4">
        {a.themes.map((t) => (
          <div key={t.title} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="font-medium">{t.title}</div>
              <div className="flex items-center gap-1.5 shrink-0">
                <SentimentBadge sentiment={t.sentiment} />
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize", statusColor(t.status))}>
                  {t.status}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.explanation}</p>
            <blockquote className="mt-3 text-xs italic text-muted-foreground border-l-2 border-border pl-3">
              {t.evidence}
            </blockquote>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NarrativeCard({ a }: { a: EarningsAnalysis }) {
  const n = a.narrative;
  return (
    <Card
      title="Management narrative"
      actions={<CopyButton text={JSON.stringify(n, null, 2)} label="Copy" />}
    >
      <div className="space-y-4 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Core story</div>
          <div className="mt-1">{n.coreStory}</div>
        </div>
        <NarrativeList label="Growth drivers" items={n.growthDrivers} />
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Profitability</div>
          <div className="mt-1">{n.profitabilityStory}</div>
        </div>
        <NarrativeList label="Strategic priorities" items={n.strategicPriorities} />
        <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
          <div>
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className="text-sm font-medium">{n.confidenceLevel}</div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-xs text-muted-foreground">Tone change</div>
            <div className="text-sm">{n.toneChange}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function NarrativeList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <ul className="mt-1 space-y-1">
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <span className="text-primary mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QACard({ a }: { a: EarningsAnalysis }) {
  const q = a.qa;
  const sections: [string, string[]][] = [
    ["Top concerns", q.topConcerns],
    ["Pushed topics", q.pushedTopics],
    ["Repeated questions", q.repeatedQuestions],
    ["Strongest answers", q.strongestAnswers],
    ["Weakest answers", q.weakestAnswers],
  ];
  return (
    <Card title="Analyst Q&A sentiment">
      <div className="space-y-4 text-sm">
        {sections.map(([label, items]) => (
          <div key={label}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <ul className="mt-1 space-y-1">
              {items.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="text-muted-foreground mt-1">·</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BullBearCard({
  title,
  tone,
  a,
}: {
  title: string;
  tone: "bull" | "bear";
  a: EarningsAnalysis["bull"];
}) {
  const color = tone === "bull" ? "var(--bull)" : "var(--bear)";
  const Icon = tone === "bull" ? TrendingUp : TrendingDown;
  return (
    <section
      className="rounded-xl border p-5 md:p-6 bg-card"
      style={{ borderColor: `color-mix(in oklab, ${color} 40%, transparent)` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: `${color}` }} />
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color }}>
            {title}
          </h2>
        </div>
        <CopyButton text={`${title}\n${a.mainArgument}\n\n${a.points.join("\n• ")}`} label="Copy" />
      </div>
      <p className="mt-3 text-sm font-medium">{a.mainArgument}</p>
      <ul className="mt-3 space-y-1 text-sm">
        {a.points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ background: color }} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {(a.catalysts || a.risks) && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {tone === "bull" ? "Catalysts" : "Risks"}
          </div>
          <ul className="mt-1 space-y-1 text-sm">
            {(a.catalysts ?? a.risks ?? []).map((x) => (
              <li key={x} className="text-muted-foreground">· {x}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 text-xs text-muted-foreground italic">{a.analystView}</div>
    </section>
  );
}

function QoQCard({ a }: { a: EarningsAnalysis }) {
  const q = a.qoq;
  const cols: [string, string[], typeof TrendingUp][] = [
    ["Increasing", q.increasing, TrendingUp],
    ["Decreasing", q.decreasing, TrendingDown],
    ["New themes", q.newThemes, Plus],
    ["Dropped themes", q.droppedThemes, Minus],
  ];
  return (
    <Card title="Quarter-over-quarter" subtitle="Latest quarter vs prior 3 quarters">
      <div className="grid md:grid-cols-4 gap-4">
        {cols.map(([label, items, Icon]) => (
          <div key={label} className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {items.map((x) => (
                <li key={x} className="text-sm">· {x}</li>
              ))}
              {items.length === 0 && <li className="text-xs text-muted-foreground">None</li>}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-5 grid md:grid-cols-2 gap-4 text-sm">
        <QoQBlock label="KPI changes" body={q.kpiChanges} />
        <QoQBlock label="Guidance language" body={q.guidanceChanges} />
        <QoQBlock label="Analyst sentiment" body={q.analystSentimentChange} />
        <QoQBlock label="Repeated phrases" body={q.repeatedPhrases.join(" · ")} />
      </div>
    </Card>
  );
}


function QoQBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{body}</div>
    </div>
  );
}

function MetricsTable({ a }: { a: EarningsAnalysis }) {
  return (
    <Card title="Key metrics">
      <div className="overflow-x-auto -mx-5 md:-mx-6">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left font-medium px-5 md:px-6 py-2">Metric</th>
              <th className="text-right font-medium px-5 md:px-6 py-2">Value</th>
              <th className="text-right font-medium px-5 md:px-6 py-2">Change</th>
              <th className="text-left font-medium px-5 md:px-6 py-2">Signal</th>
            </tr>
          </thead>
          <tbody>
            {a.metrics.map((m) => (
              <tr key={m.label} className="border-b border-border/60 last:border-0">
                <td className="px-5 md:px-6 py-3">{m.label}</td>
                <td className="px-5 md:px-6 py-3 text-right tabular font-medium">{m.value}</td>
                <td className="px-5 md:px-6 py-3 text-right tabular text-muted-foreground">{m.change ?? "—"}</td>
                <td className="px-5 md:px-6 py-3">{m.sentiment && <SentimentBadge sentiment={m.sentiment} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function QuotesCard({ a }: { a: EarningsAnalysis }) {
  return (
    <Card title="Notable quotes">
      <div className="grid md:grid-cols-2 gap-4">
        {a.quotes.map((q, i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <blockquote className="text-sm italic">"{q.quote}"</blockquote>
            <div className="mt-3 flex items-center justify-between text-xs">
              <div>
                <div className="font-medium">{q.speaker}</div>
                <div className="text-muted-foreground">{q.role}</div>
              </div>
              <span className="px-2 py-0.5 rounded-md border border-border text-muted-foreground">
                {q.topic}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{q.whyItMatters}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function WatchlistNextQuarter({ a }: { a: EarningsAnalysis }) {
  const groups = a.watchlist.reduce<Record<string, string[]>>((acc, w) => {
    (acc[w.category] ??= []).push(w.item);
    return acc;
  }, {});
  return (
    <Card title="Next-quarter watchlist" subtitle="What to monitor going into next earnings">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat} className="rounded-lg border border-border p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{cat}</div>
            <ul className="mt-2 space-y-1 text-sm">
              {items.map((x) => (
                <li key={x}>· {x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] hover:bg-accent"
    >
      {copied ? <Check className="h-3 w-3 text-[color:var(--bull)]" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function analysisToMarkdown(a: EarningsAnalysis) {
  const p = a.profile;
  const upside = ((a.priceTarget.average - a.priceTarget.current) / a.priceTarget.current) * 100;
  return [
    `# ${p.name} (${p.ticker}) — ${p.earningsQuarter}`,
    ``,
    `- Price: $${p.price.toFixed(2)} (${p.changePct.toFixed(2)}%)`,
    `- Market cap: ${p.marketCap}`,
    `- Sector: ${p.sector}`,
    `- Earnings date: ${p.earningsDate}`,
    `- Avg PT: $${a.priceTarget.average.toFixed(2)} (${upside.toFixed(1)}% upside) · ${a.priceTarget.analysts} analysts · ${a.priceTarget.rating}`,
    `- Sentiment score: ${a.sentimentScore}`,
    ``,
    `## Reaction`,
    `- 1D ${a.reaction.oneDay}% · 5D ${a.reaction.fiveDay}% · Since ${a.reaction.sinceEarnings}%`,
    a.reaction.reasonSummary,
    ``,
    `## Call summary`,
    a.callSummary,
    ``,
    `## Themes`,
    ...a.themes.map((t) => `- **${t.title}** (${t.sentiment} · ${t.status}) — ${t.explanation}`),
    ``,
    `## Bull case`,
    a.bull.mainArgument,
    ...a.bull.points.map((p) => `- ${p}`),
    ``,
    `## Bear case`,
    a.bear.mainArgument,
    ...a.bear.points.map((p) => `- ${p}`),
    ``,
    `## Key metrics`,
    ...a.metrics.map((m) => `- ${m.label}: ${m.value}${m.change ? ` (${m.change})` : ""}`),
    ``,
    `## Next-quarter watchlist`,
    ...a.watchlist.map((w) => `- [${w.category}] ${w.item}`),
  ].join("\n");
}

function ExportButton({ analysis }: { analysis: EarningsAnalysis }) {
  return (
    <button
      onClick={() => {
        const md = analysisToMarkdown(analysis);
        const blob = new Blob([md], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${analysis.profile.ticker}-${analysis.profile.earningsQuarter.replace(/\s+/g, "-")}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
    >
      <Download className="h-3.5 w-3.5" /> Export
    </button>
  );
}

function IRLinksBar({ ticker, companyName }: { ticker: string; companyName: string }) {
  const links = getIRLinks(ticker, companyName);
  const items = [
    { icon: FileText, label: "Transcript", href: links.transcript },
    { icon: Video, label: "Webcast", href: links.webcast },
    { icon: Presentation, label: "Slides", href: links.presentation },
    { icon: Newspaper, label: "Press release", href: links.pressRelease },
    { icon: Landmark, label: "SEC filings", href: links.secFilings },
  ];
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Earnings assets
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:border-primary/50 hover:text-primary transition"
            >
              <it.icon className="h-3.5 w-3.5" />
              {it.label}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}


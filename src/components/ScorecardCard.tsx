import type { Scorecard, Sentiment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";

function scoreColor(score: number): string {
  if (score >= 7) return "var(--bull)";
  if (score >= 4) return "var(--neutral)";
  return "var(--bear)";
}

function overallLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Constructive";
  if (score >= 45) return "Mixed";
  if (score >= 30) return "Cautious";
  return "Weak";
}

function ToneBadge({ tone }: { tone: Sentiment }) {
  const Icon = tone === "positive" ? TrendingUp : tone === "negative" ? TrendingDown : Minus;
  const color =
    tone === "positive" ? "var(--bull)" : tone === "negative" ? "var(--bear)" : "var(--neutral)";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md border"
      style={{ color, borderColor: `color-mix(in oklab, ${color} 40%, transparent)` }}
    >
      <Icon className="h-3.5 w-3.5" />
      {tone.charAt(0).toUpperCase() + tone.slice(1)}
    </span>
  );
}

function Bar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const displayScore = invert ? 10 - value : value;
  const pct = Math.max(4, Math.min(100, (value / 10) * 100));
  const color = scoreColor(displayScore);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="tabular text-sm font-semibold" style={{ color }}>
          {value.toFixed(1)}
          <span className="text-muted-foreground text-[10px] font-normal"> / 10</span>
        </div>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export function ScorecardCard({ scorecard }: { scorecard: Scorecard }) {
  const color = scoreColor(scorecard.overall / 10);
  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            The Earnings IQ Scorecard
          </div>
          <div className="mt-2 text-sm text-foreground max-w-xl">{scorecard.headline}</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right tabular">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Overall
            </div>
            <div className="text-4xl font-semibold leading-none" style={{ color }}>
              {scorecard.overall}
            </div>
            <div className="text-[11px] mt-1" style={{ color }}>
              {overallLabel(scorecard.overall)}
            </div>
          </div>
          <div
            className={cn(
              "h-16 w-16 rounded-full grid place-items-center border-4",
            )}
            style={{ borderColor: color }}
          >
            <div className="text-xs tabular text-muted-foreground">/100</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-4">
        <Bar label="Management confidence" value={scorecard.managementConfidence} />
        <Bar label="Analyst skepticism" value={scorecard.analystSkepticism} invert />
        <Bar label="Margin story" value={scorecard.marginStory} />
        <Bar label="Demand language" value={scorecard.demandLanguage} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-xs text-muted-foreground">Guidance tone</div>
        <ToneBadge tone={scorecard.guidanceTone} />
      </div>
    </section>
  );
}

export function ScorecardSkeleton() {
  return (
    <section className="rounded-xl border border-dashed border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
        The Earnings IQ Scorecard
      </div>
      <div className="mt-4 text-sm text-muted-foreground">Scoring the latest quarter…</div>
    </section>
  );
}

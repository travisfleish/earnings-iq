import type { EarningsAnalysis } from "@/lib/types";

/** Max characters sent to ElevenLabs (keeps cost and latency predictable). */
const MAX_SCRIPT_CHARS = 4_500;

function formatPct(n: number) {
  const sign = n >= 0 ? "plus" : "minus";
  return `${sign} ${Math.abs(n).toFixed(1)} percent`;
}

function sentimentLabel(score: number) {
  if (score >= 40) return "constructive";
  if (score <= -20) return "cautious";
  return "mixed";
}

/**
 * Turns structured earnings analysis into a short spoken script (~3–5 min).
 */
export function analysisToPodcastScript(a: EarningsAnalysis): string {
  const p = a.profile;
  const upside = ((a.priceTarget.average - a.priceTarget.current) / a.priceTarget.current) * 100;
  const topThemes = a.themes.slice(0, 3);
  const topMetrics = a.metrics.slice(0, 4);
  const topWatch = a.watchlist.slice(0, 3);

  const sections = [
    `Welcome to your Earnings IQ brief for ${p.name}, ticker ${p.ticker}, covering ${p.earningsQuarter}.`,
    `The stock is trading around ${p.price.toFixed(2)} dollars, ${formatPct(p.changePct)} on the day. Analysts cover it with an average price target near ${a.priceTarget.average.toFixed(0)} dollars, roughly ${Math.abs(upside).toFixed(0)} percent ${upside >= 0 ? "upside" : "downside"} from here, and a ${a.priceTarget.rating} consensus among ${a.priceTarget.analysts} analysts.`,
    `Overall sentiment reads ${sentimentLabel(a.sentimentScore)}. The stock moved ${formatPct(a.reaction.oneDay)} the day after earnings and ${formatPct(a.reaction.sinceEarnings)} since the report. ${a.reaction.reasonSummary}`,
    `Here is the executive summary. ${a.callSummary}`,
    topThemes.length
      ? `Three themes to watch. ${topThemes
          .map((t, i) => `Number ${i + 1}: ${t.title}. ${t.explanation}`)
          .join(" ")}`
      : "",
    `On the bull side: ${a.bull.mainArgument} ${a.bull.points.slice(0, 2).join(". ")}.`,
    `On the bear side: ${a.bear.mainArgument} ${a.bear.points.slice(0, 2).join(". ")}.`,
    topMetrics.length
      ? `Key numbers. ${topMetrics.map((m) => `${m.label}: ${m.value}${m.change ? `, ${m.change}` : ""}`).join(". ")}.`
      : "",
    topWatch.length
      ? `What to watch next quarter. ${topWatch.map((w) => `${w.category}: ${w.item}`).join(". ")}.`
      : "",
    `That wraps your Earnings IQ brief for ${p.ticker}. Open the full report on Earnings IQ for transcripts, quotes, and quarter-over-quarter detail.`,
  ];

  const script = sections
    .filter(Boolean)
    .join("\n\n")
    .replace(/\s+/g, " ")
    .replace(/["'`]/g, "")
    .trim();

  if (script.length <= MAX_SCRIPT_CHARS) return script;
  return `${script.slice(0, MAX_SCRIPT_CHARS - 80).trim()}… That wraps your brief for ${p.ticker}. Visit Earnings IQ for the full report.`;
}

export function podcastTitle(a: EarningsAnalysis): string {
  return `${a.profile.ticker} ${a.profile.earningsQuarter} — Earnings IQ Brief`;
}

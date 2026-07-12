import { unstable_cache } from "next/cache";
import { chatCompletionJson, getAiGatewayAuthHeader } from "@/lib/ai-gateway";
import { fetchMarketContext, type MarketContext } from "@/lib/marketContext";
import type {
  AnalystQA,
  BullBearCase,
  EarningsAnalysis,
  EarningsReaction,
  EarningsTheme,
  KeyMetric,
  ManagementNarrative,
  PriceTarget,
  QoQComparison,
  Quote,
  Rating,
  Sentiment,
  ThemeStatus,
  WatchItem,
} from "@/lib/types";

const ANALYSIS_MODELS = [
  process.env.AI_ANALYSIS_MODEL,
  "perplexity/sonar",
  "google/gemini-2.5-flash",
].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function asSentiment(v: unknown): Sentiment {
  const s = asString(v).toLowerCase();
  if (s.startsWith("pos")) return "positive";
  if (s.startsWith("neg")) return "negative";
  return "neutral";
}

function asThemeStatus(v: unknown): ThemeStatus {
  const s = asString(v).toLowerCase();
  if (s === "new") return "new";
  if (s === "fading") return "fading";
  return "recurring";
}

function asRating(v: unknown, upsidePct: number): Rating {
  const s = asString(v);
  if (s === "Buy" || s === "Hold" || s === "Sell" || s === "Mixed") return s;
  if (upsidePct > 10) return "Buy";
  if (upsidePct < -5) return "Sell";
  if (upsidePct >= 0) return "Hold";
  return "Mixed";
}

function asConfidence(v: unknown): ManagementNarrative["confidenceLevel"] {
  const s = asString(v).toLowerCase();
  if (s.startsWith("high")) return "High";
  if (s.startsWith("low")) return "Low";
  return "Medium";
}

function asWatchCategory(v: unknown): WatchItem["category"] {
  const s = asString(v);
  const allowed: WatchItem["category"][] = ["Metric", "Theme", "Risk", "Question", "Catalyst"];
  return allowed.includes(s as WatchItem["category"]) ? (s as WatchItem["category"]) : "Theme";
}

function asStringArray(v: unknown, min = 1, fallback: string[] = []): string[] {
  if (!Array.isArray(v)) return fallback.length ? fallback : ["—"];
  const items = v.map((x) => asString(x)).filter(Boolean);
  return items.length >= min ? items : fallback.length ? fallback : ["—"];
}

function formatMarketCap(value: number | null): string {
  if (!value || value <= 0) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

function buildPrompt(ctx: MarketContext): string {
  return `Analyze the MOST RECENT reported earnings for ${ctx.name} (${ctx.ticker}), a ${ctx.sector} company.

Use your knowledge of the latest public earnings call, press release, and analyst reaction. If multiple quarters exist, focus on the latest reported quarter only.

Live market snapshot (use these exact values in profile.price, profile.change, profile.changePct, priceTarget.current):
- Price: $${ctx.price.toFixed(2)}
- Daily change: ${ctx.changePct.toFixed(2)}%
- Sector: ${ctx.sector}

Return JSON ONLY matching this schema (no markdown, no commentary outside JSON):

{
  "profile": {
    "ticker": "${ctx.ticker}",
    "name": string,
    "sector": string,
    "marketCap": string (e.g. "$3.2T"),
    "earningsDate": string (ISO date YYYY-MM-DD of the earnings report),
    "earningsQuarter": string (e.g. "Q1 FY2026")
  },
  "priceTarget": {
    "average": number,
    "high": number,
    "low": number,
    "analysts": number,
    "rating": "Buy" | "Hold" | "Sell" | "Mixed"
  },
  "reaction": {
    "oneDay": number (stock % move day after earnings),
    "fiveDay": number,
    "sinceEarnings": number,
    "reasonSummary": string,
    "marketReaction": string
  },
  "callSummary": string (2-4 sentences, executive brief),
  "sentimentScore": number (-100 to 100),
  "themes": [
    { "title": string, "explanation": string, "evidence": string, "sentiment": "positive"|"negative"|"neutral", "status": "new"|"recurring"|"fading" }
  ] (5-7 items),
  "narrative": {
    "coreStory": string,
    "growthDrivers": string[],
    "profitabilityStory": string,
    "strategicPriorities": string[],
    "confidenceLevel": "High"|"Medium"|"Low",
    "toneChange": string
  },
  "qa": {
    "topConcerns": string[],
    "pushedTopics": string[],
    "repeatedQuestions": string[],
    "strongestAnswers": string[],
    "weakestAnswers": string[]
  },
  "bull": {
    "mainArgument": string,
    "points": string[],
    "catalysts": string[],
    "analystView": string
  },
  "bear": {
    "mainArgument": string,
    "points": string[],
    "risks": string[],
    "analystView": string
  },
  "qoq": {
    "increasing": string[],
    "decreasing": string[],
    "newThemes": string[],
    "droppedThemes": string[],
    "repeatedPhrases": string[],
    "kpiChanges": string,
    "guidanceChanges": string,
    "analystSentimentChange": string
  },
  "metrics": [
    { "label": string, "value": string, "change": string, "sentiment": "positive"|"negative"|"neutral" }
  ] (4-8 items with real reported figures),
  "quotes": [
    { "speaker": string, "role": string, "topic": string, "quote": string, "whyItMatters": string }
  ] (3-5 items from the actual call),
  "watchlist": [
    { "category": "Metric"|"Theme"|"Risk"|"Question"|"Catalyst", "item": string }
  ] (4-6 items for next quarter)
}

Be specific with real numbers, product names, and management quotes from the latest quarter. Do not invent a quarter — use the actual most recent reported period.`;
}

function normalizeTheme(raw: unknown, idx: number): EarningsTheme {
  const t = (raw ?? {}) as Record<string, unknown>;
  return {
    title: asString(t.title, `Theme ${idx + 1}`),
    explanation: asString(t.explanation, "Discussed on the latest earnings call."),
    evidence: asString(t.evidence, "Referenced in prepared remarks or Q&A."),
    sentiment: asSentiment(t.sentiment),
    status: asThemeStatus(t.status),
  };
}

function normalizeQuote(raw: unknown, idx: number): Quote {
  const q = (raw ?? {}) as Record<string, unknown>;
  return {
    speaker: asString(q.speaker, idx === 0 ? "CEO" : "CFO"),
    role: asString(q.role, "Management"),
    topic: asString(q.topic, "Outlook"),
    quote: asString(q.quote, "We remain focused on executing our operating plan."),
    whyItMatters: asString(q.whyItMatters, "Anchors the investment narrative."),
  };
}

function normalizeMetric(raw: unknown): KeyMetric {
  const m = (raw ?? {}) as Record<string, unknown>;
  return {
    label: asString(m.label, "Metric"),
    value: asString(m.value, "—"),
    change: asString(m.change) || undefined,
    sentiment: asSentiment(m.sentiment),
  };
}

function normalizeWatchItem(raw: unknown): WatchItem {
  const w = (raw ?? {}) as Record<string, unknown>;
  return {
    category: asWatchCategory(w.category),
    item: asString(w.item, "Monitor next-quarter trajectory"),
  };
}

function normalizeBullBear(raw: unknown, side: "bull" | "bear"): BullBearCase {
  const b = (raw ?? {}) as Record<string, unknown>;
  const base: BullBearCase = {
    mainArgument: asString(
      b.mainArgument,
      side === "bull" ? "Execution supports the bull case." : "Risks remain on the bear case.",
    ),
    points: asStringArray(b.points, 2, ["Key debate point"]),
    analystView: asString(b.analystView, "Street views remain divided."),
  };
  if (side === "bull") {
    base.catalysts = asStringArray(b.catalysts, 1, ["Next earnings print"]);
  } else {
    base.risks = asStringArray(b.risks, 1, ["Macro / execution risk"]);
  }
  return base;
}

export function normalizeLlmAnalysis(raw: Record<string, unknown>, ctx: MarketContext): EarningsAnalysis {
  const profileRaw = (raw.profile ?? {}) as Record<string, unknown>;
  const ptRaw = (raw.priceTarget ?? {}) as Record<string, unknown>;
  const reactionRaw = (raw.reaction ?? {}) as Record<string, unknown>;
  const narrativeRaw = (raw.narrative ?? {}) as Record<string, unknown>;
  const qaRaw = (raw.qa ?? {}) as Record<string, unknown>;
  const qoqRaw = (raw.qoq ?? {}) as Record<string, unknown>;

  const average = clamp(ptRaw.average, 0, 1_000_000, ctx.price);
  const high = clamp(ptRaw.high, 0, 1_000_000, average * 1.15);
  const low = clamp(ptRaw.low, 0, 1_000_000, average * 0.85);
  const upside = ((average - ctx.price) / ctx.price) * 100;

  const priceTarget: PriceTarget = {
    current: ctx.price,
    average,
    high: Math.max(high, average),
    low: Math.min(low, average, ctx.price),
    analysts: clamp(ptRaw.analysts, 1, 200, 20),
    rating: asRating(ptRaw.rating, upside),
  };

  const reaction: EarningsReaction = {
    oneDay: clamp(reactionRaw.oneDay, -50, 50, 0),
    fiveDay: clamp(reactionRaw.fiveDay, -50, 50, 0),
    sinceEarnings: clamp(reactionRaw.sinceEarnings, -50, 50, 0),
    reasonSummary: asString(
      reactionRaw.reasonSummary,
      "Investors focused on the latest guide and demand commentary.",
    ),
    marketReaction: asString(
      reactionRaw.marketReaction,
      "Reaction reflected the balance of beats/misses and forward guidance.",
    ),
  };

  const narrative: ManagementNarrative = {
    coreStory: asString(narrativeRaw.coreStory, `${ctx.name} is executing its multi-year plan.`),
    growthDrivers: asStringArray(narrativeRaw.growthDrivers, 2, ["Core growth"]),
    profitabilityStory: asString(
      narrativeRaw.profitabilityStory,
      "Management discussed margin trajectory and operating leverage.",
    ),
    strategicPriorities: asStringArray(narrativeRaw.strategicPriorities, 2, ["Strategic priorities"]),
    confidenceLevel: asConfidence(narrativeRaw.confidenceLevel),
    toneChange: asString(narrativeRaw.toneChange, "Tone consistent with prior quarter."),
  };

  const qa: AnalystQA = {
    topConcerns: asStringArray(qaRaw.topConcerns, 2, ["Forward visibility"]),
    pushedTopics: asStringArray(qaRaw.pushedTopics, 2, ["Growth drivers"]),
    repeatedQuestions: asStringArray(qaRaw.repeatedQuestions, 1, ["Sustainability of demand?"]),
    strongestAnswers: asStringArray(qaRaw.strongestAnswers, 1, ["Demand framing"]),
    weakestAnswers: asStringArray(qaRaw.weakestAnswers, 1, ["Near-term visibility"]),
  };

  const qoq: QoQComparison = {
    increasing: asStringArray(qoqRaw.increasing, 1, ["Core KPIs"]),
    decreasing: asStringArray(qoqRaw.decreasing, 0, []),
    newThemes: asStringArray(qoqRaw.newThemes, 0, []),
    droppedThemes: asStringArray(qoqRaw.droppedThemes, 0, []),
    repeatedPhrases: asStringArray(qoqRaw.repeatedPhrases, 1, ["multi-year opportunity"]),
    kpiChanges: asString(qoqRaw.kpiChanges, "KPI trends discussed on the call."),
    guidanceChanges: asString(qoqRaw.guidanceChanges, "Guidance updated on the print."),
    analystSentimentChange: asString(
      qoqRaw.analystSentimentChange,
      "Analyst tone shifted modestly post-earnings.",
    ),
  };

  const themes = Array.isArray(raw.themes)
    ? raw.themes.slice(0, 8).map(normalizeTheme)
    : [normalizeTheme(null, 0)];
  const metrics = Array.isArray(raw.metrics)
    ? raw.metrics.slice(0, 10).map(normalizeMetric)
    : [normalizeMetric(null)];
  const quotes = Array.isArray(raw.quotes)
    ? raw.quotes.slice(0, 6).map(normalizeQuote)
    : [normalizeQuote(null, 0)];
  const watchlist = Array.isArray(raw.watchlist)
    ? raw.watchlist.slice(0, 8).map(normalizeWatchItem)
    : [normalizeWatchItem(null)];

  return {
    profile: {
      ticker: ctx.ticker,
      name: asString(profileRaw.name, ctx.name),
      sector: asString(profileRaw.sector, ctx.sector),
      marketCap: asString(profileRaw.marketCap, formatMarketCap(ctx.marketCapUsd)),
      price: ctx.price,
      change: ctx.change,
      changePct: ctx.changePct,
      earningsDate: asString(profileRaw.earningsDate, new Date().toISOString().slice(0, 10)),
      earningsQuarter: asString(profileRaw.earningsQuarter, "Latest quarter"),
    },
    priceTarget,
    reaction,
    callSummary: asString(
      raw.callSummary,
      `${ctx.name} reported latest earnings with management highlighting key operating themes.`,
    ),
    sentimentScore: clamp(raw.sentimentScore, -100, 100, 0),
    themes,
    narrative,
    qa,
    bull: normalizeBullBear(raw.bull, "bull"),
    bear: normalizeBullBear(raw.bear, "bear"),
    qoq,
    metrics,
    quotes,
    watchlist,
  };
}

async function callAnalysisModel(
  ctx: MarketContext,
): Promise<Record<string, unknown> | null> {
  const messages = [
    {
      role: "system" as const,
      content:
        "You are a senior equity research analyst. Produce accurate, structured earnings intelligence from the latest public information. Return valid JSON only.",
    },
    { role: "user" as const, content: buildPrompt(ctx) },
  ];

  for (const model of ANALYSIS_MODELS) {
    const parsed = await chatCompletionJson<Record<string, unknown>>({ model, messages });
    if (parsed) return parsed;
  }
  return null;
}

export async function generateLlmAnalysis(ctx: MarketContext): Promise<EarningsAnalysis | null> {
  if (!getAiGatewayAuthHeader()) return null;

  const raw = await callAnalysisModel(ctx);
  if (!raw) return null;

  try {
    return normalizeLlmAnalysis(raw, ctx);
  } catch (err) {
    console.error("Failed to normalize LLM analysis:", err);
    return null;
  }
}

const getCachedLlmAnalysis = unstable_cache(
  async (ticker: string) => {
    const ctx = await fetchMarketContext(ticker);
    if (!ctx) return null;
    return generateLlmAnalysis(ctx);
  },
  ["llm-earnings-analysis"],
  { revalidate: 3600 },
);

export async function getLlmAnalysisForTicker(ticker: string): Promise<EarningsAnalysis | null> {
  return getCachedLlmAnalysis(ticker.toUpperCase());
}

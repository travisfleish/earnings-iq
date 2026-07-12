import type {
  EarningsAnalysis,
  EarningsTheme,
  KeyMetric,
  Quote,
  Sentiment,
  ThemeStatus,
  WatchItem,
} from "@/lib/types";

// Deterministic hash → pseudo-random helpers. Same ticker always yields the
// same synthesized analysis so the page is stable across reloads.
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function formatMarketCap(value: number | null | undefined): string {
  if (!value || value <= 0) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

function inferQuarter(date: Date): string {
  const m = date.getMonth();
  const q = Math.floor(m / 3) + 1;
  return `Q${q} FY${date.getFullYear()}`;
}

export interface SynthesizeInput {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePct: number;
  marketCapUsd?: number | null;
  earningsDateIso?: string | null;
}

const SECTOR_THEMES: Record<string, string[]> = {
  Technology: [
    "AI product monetization",
    "Cloud gross margin trajectory",
    "Enterprise pipeline conversion",
    "Developer platform adoption",
    "Regulatory posture on data & antitrust",
  ],
  "Communication Services": [
    "Engagement per DAU",
    "Ad load and pricing power",
    "AI-driven recommendation lift",
    "Content cost discipline",
    "Subscription mix shift",
  ],
  "Consumer Cyclical": [
    "Same-store sales momentum",
    "Promotional intensity vs peers",
    "Inventory freshness",
    "International expansion pace",
    "Loyalty program contribution",
  ],
  "Consumer Defensive": [
    "Volume vs price/mix split",
    "Private-label competition",
    "Input cost outlook",
    "Emerging markets execution",
    "Cash return to shareholders",
  ],
  "Financial Services": [
    "Net interest margin trajectory",
    "Credit quality and reserve build",
    "Fee income diversification",
    "Capital return capacity",
    "Deposit beta trends",
  ],
  Healthcare: [
    "Pipeline readouts and timing",
    "Payer mix and reimbursement",
    "Manufacturing scale-up",
    "Regulatory catalysts",
    "R&D productivity",
  ],
  Industrials: [
    "Backlog conversion",
    "Pricing versus input costs",
    "Aftermarket / services attach",
    "Automation investment payback",
    "Supply chain normalization",
  ],
  Energy: [
    "Break-even per barrel",
    "Capital discipline and buybacks",
    "Renewables transition capex",
    "Basin-level productivity",
    "Return on capital employed",
  ],
  "Basic Materials": [
    "Realized pricing trend",
    "Cost curve positioning",
    "Grade and recovery rates",
    "ESG capex requirements",
    "Inventory destocking cycle",
  ],
  "Real Estate": [
    "Same-store NOI growth",
    "Occupancy and leasing spreads",
    "Cost of capital",
    "Development pipeline yield",
    "Tenant credit quality",
  ],
  Utilities: [
    "Rate case outcomes",
    "Capex plan visibility",
    "Renewables transition costs",
    "Regulatory relationships",
    "Dividend coverage",
  ],
  Semiconductors: [
    "Design win pipeline",
    "Foundry capacity and lead times",
    "Inventory across channel",
    "AI accelerator mix",
    "Gross margin path",
  ],
  Default: [
    "Revenue growth durability",
    "Operating leverage",
    "Free cash flow conversion",
    "Competitive positioning",
    "Capital allocation discipline",
  ],
};

const POSITIVE_TONE = [
  "Management struck a confident tone",
  "Commentary skewed constructive",
  "Guidance framed with above-plan momentum",
];
const NEUTRAL_TONE = [
  "Management framed the quarter as on-track",
  "Tone was steady with balanced commentary",
  "Guidance was reiterated without notable surprise",
];
const NEGATIVE_TONE = [
  "Management acknowledged softer momentum",
  "Guidance was tempered relative to consensus",
  "Commentary was defensive on near-term visibility",
];

export function synthesizeAnalysis(input: SynthesizeInput): EarningsAnalysis {
  const rng = makeRng(hash(input.ticker));
  const sectorKey = input.sector in SECTOR_THEMES ? input.sector : "Default";
  const themePool = SECTOR_THEMES[sectorKey];

  const reactionBias = input.changePct;
  const oneDay = +(reactionBias + (rng() - 0.5) * 4).toFixed(1);
  const fiveDay = +(oneDay * (0.8 + rng() * 0.6)).toFixed(1);
  const sinceEarnings = +(fiveDay * (0.9 + rng() * 0.6)).toFixed(1);

  const sentimentScore = Math.max(
    -85,
    Math.min(85, Math.round(oneDay * 6 + (rng() - 0.5) * 20)),
  );
  const overall: Sentiment =
    sentimentScore >= 20 ? "positive" : sentimentScore <= -20 ? "negative" : "neutral";
  const toneBank =
    overall === "positive" ? POSITIVE_TONE : overall === "negative" ? NEGATIVE_TONE : NEUTRAL_TONE;

  const targetSpread = 0.35 + rng() * 0.25; // ±17-30%
  const average = +(input.price * (1 + (rng() - 0.4) * targetSpread)).toFixed(2);
  const low = +(Math.min(input.price, average) * (1 - (0.1 + rng() * 0.15))).toFixed(2);
  const high = +(Math.max(input.price, average) * (1 + (0.1 + rng() * 0.2))).toFixed(2);
  const analysts = 6 + Math.floor(rng() * 30);
  const upside = (average - input.price) / input.price;
  const rating = upside > 0.1 ? "Buy" : upside < -0.05 ? "Sell" : upside > 0 ? "Hold" : "Mixed";

  const earningsDate = input.earningsDateIso
    ? new Date(input.earningsDateIso)
    : new Date(Date.now() - (14 + Math.floor(rng() * 30)) * 86_400_000);
  const earningsDateStr = earningsDate.toISOString().slice(0, 10);
  const earningsQuarter = inferQuarter(earningsDate);

  const themes: EarningsTheme[] = themePool.slice(0, 5).map((title, i) => {
    const sent: Sentiment =
      i === 0 ? overall : i === themePool.length - 1 ? (overall === "positive" ? "negative" : overall === "negative" ? "positive" : "neutral") : pick(rng, ["positive", "neutral", "negative"] as const);
    const status: ThemeStatus = pick(rng, ["new", "recurring", "recurring", "fading"] as const);
    return {
      title,
      explanation: `${input.name} management addressed ${title.toLowerCase()} in detail, tying it to the multi-quarter operating plan.`,
      evidence: `Referenced multiple times in prepared remarks and analyst Q&A.`,
      sentiment: sent,
      status,
    };
  });

  const metrics: KeyMetric[] = [
    { label: "Revenue", value: "—", change: "vs consensus", sentiment: overall },
    { label: "Operating margin", value: "—", change: "YoY", sentiment: overall },
    { label: "Free cash flow", value: "—", change: "TTM", sentiment: "neutral" },
    { label: "Guidance", value: overall === "positive" ? "Raised" : overall === "negative" ? "Lowered" : "Reiterated", sentiment: overall },
  ];

  const quotes: Quote[] = [
    {
      speaker: "CEO",
      role: `${input.name} — Chief Executive Officer`,
      topic: themes[0]?.title ?? "Outlook",
      quote: `We are executing against our plan and see continued momentum across our core business.`,
      whyItMatters: "Anchors the multi-quarter narrative for investors.",
    },
    {
      speaker: "CFO",
      role: `${input.name} — Chief Financial Officer`,
      topic: "Capital allocation",
      quote: `Our capital priorities remain unchanged: invest in growth, maintain a strong balance sheet, and return excess cash to shareholders.`,
      whyItMatters: "Signals discipline on buybacks and reinvestment mix.",
    },
  ];

  const watchlist: WatchItem[] = [
    { category: "Metric", item: `${themes[0]?.title ?? "Revenue"} trajectory next quarter` },
    { category: "Theme", item: `Progress on ${themes[1]?.title.toLowerCase() ?? "operating plan"}` },
    { category: "Risk", item: `Downside case on ${themes[themes.length - 1]?.title.toLowerCase() ?? "guidance"}` },
    { category: "Catalyst", item: `Next investor update / product event` },
    { category: "Question", item: `Sustainability of ${overall} sentiment into the second half` },
  ];

  return {
    isPreview: true,
    profile: {
      ticker: input.ticker,
      name: input.name,
      sector: input.sector,
      marketCap: formatMarketCap(input.marketCapUsd ?? null),
      price: input.price,
      change: input.change,
      changePct: input.changePct,
      earningsDate: earningsDateStr,
      earningsQuarter,
    },
    priceTarget: {
      current: input.price,
      average,
      high,
      low,
      analysts,
      rating,
    },
    reaction: {
      oneDay,
      fiveDay,
      sinceEarnings,
      reasonSummary: `${pick(rng, toneBank)} on the ${earningsQuarter} print. Investors focused on ${themes[0]?.title.toLowerCase() ?? "the outlook"} and the near-term guide.`,
      marketReaction: overall === "positive"
        ? "Shares traded higher post-print with sector peers following."
        : overall === "negative"
        ? "Shares came under pressure as investors reassessed forward assumptions."
        : "Muted reaction — the print was largely in line with expectations.",
    },
    callSummary: `${input.name} (${input.ticker}) delivered ${earningsQuarter} results with management emphasizing ${themes[0]?.title.toLowerCase() ?? "operating execution"} and ${themes[1]?.title.toLowerCase() ?? "financial discipline"}. Tone across prepared remarks and Q&A was ${overall}, and the outlook was ${overall === "positive" ? "framed with confidence" : overall === "negative" ? "measured given macro cross-currents" : "steady with limited surprise"}. This preview view is generated from live market data — connect a transcript & LLM provider to replace with a full curated brief.`,
    sentimentScore,
    themes,
    narrative: {
      coreStory: `${input.name} is executing a multi-year plan in ${input.sector.toLowerCase() || "its sector"} with a focus on ${themes[0]?.title.toLowerCase() ?? "durable growth"}.`,
      growthDrivers: themes.slice(0, 3).map((t) => t.title),
      profitabilityStory: `Operating leverage story is ${overall}; management continues to prioritize disciplined spend against the demand backdrop.`,
      strategicPriorities: themes.slice(2, 5).map((t) => t.title),
      confidenceLevel: overall === "positive" ? "High" : overall === "negative" ? "Low" : "Medium",
      toneChange: overall === "positive" ? "More confident vs prior quarter" : overall === "negative" ? "Notably more cautious vs prior quarter" : "Consistent with prior quarter",
    },
    qa: {
      topConcerns: [themes[themes.length - 1]?.title ?? "Macro", "Competitive dynamics", "Near-term visibility"],
      pushedTopics: [themes[0]?.title ?? "Growth", themes[1]?.title ?? "Margins"],
      repeatedQuestions: [`Trajectory of ${themes[0]?.title.toLowerCase() ?? "growth"}?`, "How to think about the second-half exit rate?"],
      strongestAnswers: [`Framing on ${themes[0]?.title.toLowerCase() ?? "core growth"}`, "Capital allocation discipline"],
      weakestAnswers: [`Specificity on ${themes[themes.length - 1]?.title.toLowerCase() ?? "risks"}`, "Segment-level disclosure"],
    },
    bull: {
      mainArgument: `${input.name} compounds through ${themes[0]?.title.toLowerCase() ?? "durable execution"} with room to expand margins over the multi-year plan.`,
      points: themes.slice(0, 4).map((t) => `Momentum in ${t.title.toLowerCase()}`),
      catalysts: ["Next-quarter guide", "Product / capital markets catalyst", "Estimate revisions higher"],
      analystView: `${analysts} analysts; avg PT $${average.toFixed(2)} implies ${(upside * 100).toFixed(1)}% ${upside >= 0 ? "upside" : "downside"}.`,
    },
    bear: {
      mainArgument: `Valuation prices in continued execution; any slip in ${themes[themes.length - 1]?.title.toLowerCase() ?? "growth"} could reset expectations.`,
      points: [
        `Dependency on ${themes[0]?.title.toLowerCase() ?? "the core driver"}`,
        "Macro / cyclical exposure",
        "Competitive intensity from adjacent players",
        "Limited visibility beyond the near-term guide",
      ],
      risks: ["Multiple compression on any guide-down", "Regulatory / policy shifts", "Execution risk on strategic priorities"],
      analystView: `${rating} skew with dispersion between $${low.toFixed(2)} low and $${high.toFixed(2)} high targets.`,
    },
    qoq: {
      increasing: [themes[0]?.title ?? "Core growth"],
      decreasing: [themes[themes.length - 1]?.title ?? "Legacy segment"],
      newThemes: [themes[1]?.title ?? "New initiative"],
      droppedThemes: [],
      repeatedPhrases: ["multi-year opportunity", "disciplined execution", "durable growth"],
      kpiChanges: `Trend in ${themes[0]?.title.toLowerCase() ?? "the core KPI"} continues ${overall}.`,
      guidanceChanges: overall === "positive" ? "Guidance nudged higher on the full year." : overall === "negative" ? "Guidance tempered on near-term headwinds." : "Guidance held; language largely unchanged.",
      analystSentimentChange: overall === "positive" ? "Buy-side tone incrementally more constructive." : overall === "negative" ? "Buy-side tone more cautious into next print." : "Analyst tone broadly unchanged.",
    },
    metrics,
    quotes,
    watchlist,
  };
}

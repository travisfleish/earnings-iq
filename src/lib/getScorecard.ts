import { chatCompletionJson } from "@/lib/ai-gateway";
import type { Scorecard } from "@/lib/types";

export interface ScorecardInput {
  ticker: string;
  companyName?: string;
  sector?: string;
  callSummary?: string;
  themes?: string[];
  sentimentScore?: number;
}

function clamp(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n * 10) / 10));
}

function normalizeTone(v: unknown): Scorecard["guidanceTone"] {
  const s = String(v ?? "").toLowerCase();
  if (s.startsWith("pos")) return "positive";
  if (s.startsWith("neg")) return "negative";
  return "neutral";
}

function computeOverall(s: Omit<Scorecard, "overall" | "headline">): number {
  const conf = s.managementConfidence;
  const skep = 10 - s.analystSkepticism;
  const margin = s.marginStory;
  const demand = s.demandLanguage;
  const guide = s.guidanceTone === "positive" ? 8 : s.guidanceTone === "negative" ? 3 : 5;
  const avg = (conf + skep + margin + demand + guide) / 5;
  return Math.round(avg * 10);
}

export async function getScorecardForTicker(input: ScorecardInput): Promise<Scorecard | null> {
  const parsed = await chatCompletionJson<Record<string, unknown>>({
    messages: [
      {
        role: "system",
        content:
          "You are an equity analyst. Score the latest earnings signal for one company. Return JSON only, with numeric scores from 0 to 10 (one decimal ok). Be discerning — avoid clustering everything at 5-7.",
      },
      {
        role: "user",
        content: `Ticker: ${input.ticker}
Company: ${input.companyName ?? input.ticker}
Sector: ${input.sector ?? "unknown"}
Overall sentiment score (-100 to 100): ${input.sentimentScore ?? "n/a"}
Key themes: ${(input.themes ?? []).join("; ") || "n/a"}
Call summary: ${input.callSummary ?? "n/a"}

Return JSON with EXACTLY these keys:
{
  "managementConfidence": number 0-10,
  "analystSkepticism": number 0-10,
  "marginStory": number 0-10,
  "demandLanguage": number 0-10,
  "guidanceTone": "positive" | "neutral" | "negative",
  "headline": string (max 90 chars, plain-English one-liner verdict)
}`,
      },
    ],
  });

  if (!parsed) return null;

  try {
    const base = {
      managementConfidence: clamp(parsed.managementConfidence, 0, 10, 5),
      analystSkepticism: clamp(parsed.analystSkepticism, 0, 10, 5),
      marginStory: clamp(parsed.marginStory, 0, 10, 5),
      demandLanguage: clamp(parsed.demandLanguage, 0, 10, 5),
      guidanceTone: normalizeTone(parsed.guidanceTone),
    };
    const overall = computeOverall(base);
    const headline =
      typeof parsed.headline === "string" && parsed.headline.trim().length > 0
        ? parsed.headline.slice(0, 120)
        : `${overall >= 70 ? "Constructive" : overall >= 45 ? "Mixed" : "Cautious"} signal from ${input.ticker.toUpperCase()}`;

    return { ...base, overall, headline };
  } catch (err) {
    console.error("Scorecard failed:", err);
    return null;
  }
}

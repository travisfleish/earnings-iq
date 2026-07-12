import { fetchMarketContext } from "@/lib/marketContext";
import { getLlmAnalysisForTicker } from "@/lib/generateAnalysis";
import { synthesizeAnalysis } from "@/lib/synthesizeAnalysis";
import type { EarningsAnalysis } from "@/lib/types";
import type { MarketContext } from "@/lib/marketContext";
import { getAiGatewayAuthHeader } from "@/lib/ai-gateway";

function overlayLiveMarketData(analysis: EarningsAnalysis, ctx: MarketContext): EarningsAnalysis {
  return {
    ...analysis,
    profile: {
      ...analysis.profile,
      ticker: ctx.ticker,
      name: ctx.name,
      price: ctx.price,
      change: ctx.change,
      changePct: ctx.changePct,
      sector: ctx.sector !== "—" ? ctx.sector : analysis.profile.sector,
    },
    priceTarget: {
      ...analysis.priceTarget,
      current: ctx.price,
    },
  };
}

export async function getAnalysisForTicker(ticker: string): Promise<EarningsAnalysis | null> {
  const ctx = await fetchMarketContext(ticker);
  if (!ctx) return null;

  if (getAiGatewayAuthHeader()) {
    const llm = await getLlmAnalysisForTicker(ticker);
    if (llm) return overlayLiveMarketData(llm, ctx);
  }

  return synthesizeAnalysis({
    ticker: ctx.ticker,
    name: ctx.name,
    sector: ctx.sector,
    price: ctx.price,
    change: ctx.change,
    changePct: ctx.changePct,
    marketCapUsd: ctx.marketCapUsd,
    earningsDateIso: null,
  });
}

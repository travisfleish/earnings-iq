import type { EarningsAnalysis } from "@/lib/types";
import { getAnalysisForTicker } from "@/lib/getAnalysis";

export async function analyzeEarnings(ticker: string): Promise<EarningsAnalysis | null> {
  return getAnalysisForTicker(ticker);
}

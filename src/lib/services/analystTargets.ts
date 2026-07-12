import { getAnalysisForTicker } from "@/lib/getAnalysis";

export async function fetchAnalystTargets(ticker: string) {
  const analysis = await getAnalysisForTicker(ticker);
  return analysis?.priceTarget ?? null;
}

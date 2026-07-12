// LLM analysis service placeholder.
// Sends transcripts, price targets, quote data, and news to an LLM via Vercel AI Gateway
// and returns a structured EarningsAnalysis. For v1 this returns mock data for supported tickers.

import type { EarningsAnalysis } from "@/lib/types";
import { getMockAnalysis } from "@/lib/mockData";

export async function analyzeEarnings(ticker: string): Promise<EarningsAnalysis | null> {
  // Simulate latency so the UI's loading states feel real.
  await new Promise((r) => setTimeout(r, 600));
  return getMockAnalysis(ticker);
}

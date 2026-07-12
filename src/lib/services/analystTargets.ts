// Analyst price target API service placeholder.
// Wire to Financial Modeling Prep, Finnhub, or similar.

import type { PriceTarget } from "@/lib/types";
import { getMockAnalysis } from "@/lib/mockData";

export async function fetchPriceTargets(ticker: string): Promise<PriceTarget | null> {
  return getMockAnalysis(ticker)?.priceTarget ?? null;
}

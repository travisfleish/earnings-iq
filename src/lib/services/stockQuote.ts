// Stock quote API service placeholder.
// Wire to Financial Modeling Prep, Alpha Vantage, Polygon.io, Finnhub, or Intrinio.
// Keep the shape stable so consumers do not need to change.

import type { CompanyProfile } from "@/lib/types";
import { getMockAnalysis } from "@/lib/mockData";

export async function fetchStockQuote(ticker: string): Promise<Pick<CompanyProfile, "price" | "change" | "changePct"> | null> {
  const mock = getMockAnalysis(ticker);
  if (!mock) return null;
  const { price, change, changePct } = mock.profile;
  return { price, change, changePct };
}

import { getLiveQuoteForTicker } from "@/lib/getLiveQuote";

export async function fetchStockQuote(ticker: string) {
  const quote = await getLiveQuoteForTicker(ticker);
  if (!quote) return null;
  return {
    price: quote.price,
    change: quote.change,
    changePct: quote.changePct,
  };
}

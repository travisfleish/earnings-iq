import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { EarningsAnalysis } from "@/lib/types";
import { getMockAnalysis } from "@/lib/mockData";
import { synthesizeAnalysis } from "@/lib/synthesizeAnalysis";

const InputSchema = z.object({ ticker: z.string().min(1).max(10) });

const UA =
  "Mozilla/5.0 (compatible; EarningsIQ/1.0; +https://earnings-iq.app)";

interface YahooChartMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  currency?: string;
  marketState?: string;
  regularMarketTime?: number;
  exchangeName?: string;
  symbol?: string;
  longName?: string;
  shortName?: string;
}

async function fetchChartMeta(symbol: string): Promise<YahooChartMeta | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: { result?: Array<{ meta?: YahooChartMeta }> };
    };
    return json.chart?.result?.[0]?.meta ?? null;
  } catch {
    return null;
  }
}

interface YahooSearchQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  sector?: string;
  industry?: string;
  exchange?: string;
  quoteType?: string;
}

async function fetchSearchQuote(symbol: string): Promise<YahooSearchQuote | null> {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=5&newsCount=0&enableFuzzyQuery=false`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { quotes?: YahooSearchQuote[] };
    const exact = json.quotes?.find(
      (q) => q.symbol?.toUpperCase() === symbol.toUpperCase(),
    );
    return exact ?? json.quotes?.[0] ?? null;
  } catch {
    return null;
  }
}

export const fetchAnalysis = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<EarningsAnalysis | null> => {
    const symbol = data.ticker.toUpperCase();

    // Curated dataset wins when we have one.
    const mock = getMockAnalysis(symbol);
    if (mock) return mock;

    // Otherwise synthesize using real live market data + profile lookup.
    const [meta, search] = await Promise.all([
      fetchChartMeta(symbol),
      fetchSearchQuote(symbol),
    ]);

    if (!meta || typeof meta.regularMarketPrice !== "number") {
      // Unknown ticker — no live price means we can't render a useful page.
      return null;
    }

    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prev;
    const changePct = prev ? (change / prev) * 100 : 0;

    const name =
      search?.longname ?? search?.shortname ?? meta.longName ?? meta.shortName ?? symbol;
    const sector = search?.sector ?? search?.industry ?? "—";

    return synthesizeAnalysis({
      ticker: meta.symbol ?? symbol,
      name,
      sector,
      price,
      change,
      changePct,
      marketCapUsd: null,
      earningsDateIso: null,
    });
  });

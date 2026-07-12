import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Live quote via Yahoo Finance's public chart endpoint. Server-only so we
// avoid browser CORS and can swap in a licensed provider later without
// touching the client. Keep the shape stable — the dashboard merges these
// fields on top of the mock analysis.

export interface LiveQuote {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  currency: string;
  marketState: string;
  regularMarketTime: string; // ISO
  exchangeName?: string;
  marketCap?: number | null;
  fetchedAt: string; // ISO
}

const InputSchema = z.object({ ticker: z.string().min(1).max(10) });

export const fetchLiveQuote = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<LiveQuote | null> => {
    const symbol = data.ticker.toUpperCase();
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

    try {
      const res = await fetch(url, {
        headers: {
          // A UA is required — Yahoo returns 401 without it.
          "User-Agent":
            "Mozilla/5.0 (compatible; EarningsIQ/1.0; +https://earnings-iq.app)",
          Accept: "application/json",
        },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        chart?: {
          result?: Array<{
            meta?: {
              regularMarketPrice?: number;
              chartPreviousClose?: number;
              previousClose?: number;
              currency?: string;
              marketState?: string;
              regularMarketTime?: number;
              exchangeName?: string;
              symbol?: string;
            };
          }>;
          error?: unknown;
        };
      };
      const meta = json.chart?.result?.[0]?.meta;
      if (!meta || typeof meta.regularMarketPrice !== "number") return null;

      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
      const change = price - prev;
      const changePct = prev ? (change / prev) * 100 : 0;
      const ts = meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : new Date().toISOString();

      return {
        ticker: meta.symbol ?? symbol,
        price,
        change,
        changePct,
        currency: meta.currency ?? "USD",
        marketState: meta.marketState ?? "UNKNOWN",
        regularMarketTime: ts,
        exchangeName: meta.exchangeName,
        marketCap: null,
        fetchedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  });

const UA = "Mozilla/5.0 (compatible; EarningsIQ/1.0; +https://earnings-iq.app)";

export interface MarketContext {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePct: number;
  marketCapUsd: number | null;
  exchangeName?: string;
}

interface YahooChartMeta {
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  symbol?: string;
  longName?: string;
  shortName?: string;
  exchangeName?: string;
}

interface YahooSearchQuote {
  symbol?: string;
  shortname?: string;
  longname?: string;
  sector?: string;
  industry?: string;
}

async function fetchChartMeta(symbol: string): Promise<YahooChartMeta | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 60 },
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

async function fetchSearchQuote(symbol: string): Promise<YahooSearchQuote | null> {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=5&newsCount=0&enableFuzzyQuery=false`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { quotes?: YahooSearchQuote[] };
    const exact = json.quotes?.find((q) => q.symbol?.toUpperCase() === symbol.toUpperCase());
    return exact ?? json.quotes?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchMarketContext(ticker: string): Promise<MarketContext | null> {
  const symbol = ticker.toUpperCase();
  const [meta, search] = await Promise.all([fetchChartMeta(symbol), fetchSearchQuote(symbol)]);

  if (!meta || typeof meta.regularMarketPrice !== "number") {
    return null;
  }

  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;

  return {
    ticker: meta.symbol ?? symbol,
    name: search?.longname ?? search?.shortname ?? meta.longName ?? meta.shortName ?? symbol,
    sector: search?.sector ?? search?.industry ?? "—",
    price,
    change,
    changePct,
    marketCapUsd: null,
    exchangeName: meta.exchangeName,
  };
}

// Post-earnings news / analyst commentary service placeholder.
// Wire to a licensed news API (Benzinga, NewsAPI, Polygon news, etc.) or a
// web-search API. Avoid scraping sites with restrictive TOS.

export interface NewsItem {
  headline: string;
  source: string;
  publishedAt: string;
  url: string;
}

export async function fetchPostEarningsNews(_ticker: string): Promise<NewsItem[]> {
  return [];
}

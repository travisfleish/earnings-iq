// Earnings transcript API service placeholder.
// Wire to a transcript provider (e.g. FMP transcripts endpoint, Seeking Alpha via licensed API,
// or a dedicated transcript vendor). Do NOT scrape sites that disallow it.

export interface TranscriptFetchResult {
  ticker: string;
  quarter: string;
  transcript: string;
}

export async function fetchLatestTranscript(_ticker: string): Promise<TranscriptFetchResult | null> {
  return null; // mocked upstream in getMockAnalysis
}

export async function fetchPriorTranscripts(_ticker: string, _count = 3): Promise<TranscriptFetchResult[]> {
  return [];
}

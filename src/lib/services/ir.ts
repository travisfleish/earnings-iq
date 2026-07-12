// Deterministic best-effort links to public investor-relations material for a ticker.
// These use Yahoo Finance and a generic web search so we never fabricate a URL — the
// user always lands on a real page even when we don't have a curated IR link.

export interface IRLinks {
  transcript: string;
  webcast: string;
  presentation: string;
  pressRelease: string;
  secFilings: string;
  irHome: string;
}

export function getIRLinks(ticker: string, companyName?: string): IRLinks {
  const t = ticker.toUpperCase();
  const q = encodeURIComponent(`${companyName ?? t} ${t}`);
  return {
    transcript: `https://www.google.com/search?q=${encodeURIComponent(
      `${companyName ?? t} ${t} latest earnings call transcript`,
    )}`,
    webcast: `https://www.google.com/search?q=${encodeURIComponent(
      `${companyName ?? t} ${t} earnings call webcast replay`,
    )}`,
    presentation: `https://www.google.com/search?q=${encodeURIComponent(
      `${companyName ?? t} ${t} earnings presentation slides filetype:pdf`,
    )}`,
    pressRelease: `https://www.google.com/search?q=${encodeURIComponent(
      `${companyName ?? t} ${t} earnings press release`,
    )}`,
    secFilings: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(t)}&type=&dateb=&owner=include&count=40`,
    irHome: `https://www.google.com/search?q=${q}+investor+relations`,
  };
}

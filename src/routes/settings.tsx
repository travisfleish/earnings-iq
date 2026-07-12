import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Earnings IQ" },
      { name: "description", content: "Configure data providers and app preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const providers = [
    { label: "Stock quote", options: "Financial Modeling Prep · Alpha Vantage · Polygon.io · Finnhub" },
    { label: "Analyst targets", options: "Financial Modeling Prep · Finnhub · Intrinio" },
    { label: "Earnings transcripts", options: "FMP Transcripts · Licensed transcript vendor" },
    { label: "Earnings calendar", options: "FMP · Finnhub · SEC EDGAR" },
    { label: "News / market reaction", options: "Benzinga · NewsAPI · Polygon News" },
    { label: "LLM analysis", options: "Vercel AI Gateway · OpenAI · Anthropic · Google" },
  ];
  return (
    <AppShell>
      <div className="px-4 md:px-8 py-10 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Data providers and integration status.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card divide-y divide-border">
          {providers.map((p) => (
            <div key={p.label} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-sm">{p.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.options}</div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                Not connected
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          Service files live under <code className="px-1 rounded bg-muted">src/lib/services/</code>.
          Swap the mock functions for real API calls without changing the dashboard.
        </div>
      </div>
    </AppShell>
  );
}

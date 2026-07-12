"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { useSavedReports } from "@/hooks/useSavedReports";
import { Download, FileText } from "lucide-react";

function downloadMarkdown(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SavedReportsClient() {
  const { list, hydrated, remove } = useSavedReports();

  return (
    <AppShell>
      <div className="px-4 md:px-8 py-10 max-w-4xl mx-auto">
        <PageHero>
          <h1 className="text-2xl font-semibold">Saved reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Earnings summaries you&apos;ve saved from company dashboards.
          </p>
        </PageHero>

        {!hydrated ? (
          <div className="mt-8 text-sm text-muted-foreground">Loading…</div>
        ) : list.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
            <FileText className="h-6 w-6 mx-auto text-muted-foreground" />
            <div className="mt-3 font-medium">No reports yet</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Open a company dashboard and use &ldquo;Save Report&rdquo; to store a summary here.
              You can also use &ldquo;Export&rdquo; to download a Markdown file.
            </p>
            <Link
              href="/search"
              className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Search a ticker
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {list.map((report) => (
              <div
                key={report.id}
                className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="font-semibold tabular">
                    {report.ticker}
                    <span className="text-muted-foreground font-normal ml-2">{report.companyName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{report.earningsQuarter}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Saved {new Date(report.savedAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/company/${report.ticker}`}
                    className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
                  >
                    Open dashboard
                  </Link>
                  <button
                    onClick={() =>
                      downloadMarkdown(
                        `${report.ticker}-${report.earningsQuarter.replace(/\s+/g, "-")}.md`,
                        report.markdown,
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </button>
                  <button
                    onClick={() => remove(report.id)}
                    className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { isSavedPodcast, useSavedReports, type SavedPodcast } from "@/hooks/useSavedReports";
import { getPodcastAudio } from "@/lib/podcastAudioStorage";
import { Download, FileText, Headphones } from "lucide-react";

function downloadMarkdown(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SavedPodcastCard({
  podcast,
  onRemove,
}: {
  podcast: SavedPodcast;
  onRemove: () => void;
}) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    void getPodcastAudio(podcast.id).then((audio) => {
      if (!active) return;
      if (!audio) {
        setAudioError(true);
        return;
      }
      objectUrl = URL.createObjectURL(audio.blob);
      setAudioUrl(objectUrl);
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [podcast.id]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Podcast</span>
          </div>
          <div className="font-semibold tabular mt-1">
            {podcast.ticker}
            <span className="text-muted-foreground font-normal ml-2">{podcast.companyName}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">{podcast.title}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Saved {new Date(podcast.savedAt).toLocaleString()}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Link
            href={`/company/${podcast.ticker}`}
            className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
          >
            Open dashboard
          </Link>
          <button
            onClick={onRemove}
            className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Remove
          </button>
        </div>
      </div>
      {audioError ? (
        <p className="text-sm text-muted-foreground">Audio unavailable. Regenerate the podcast from the dashboard.</p>
      ) : audioUrl ? (
        <audio src={audioUrl} className="w-full" controls />
      ) : (
        <p className="text-sm text-muted-foreground">Loading audio…</p>
      )}
    </div>
  );
}

export function SavedReportsClient() {
  const { list, hydrated, remove } = useSavedReports();

  return (
    <AppShell>
      <div className="px-4 md:px-8 py-10 max-w-4xl mx-auto">
        <PageHero>
          <h1 className="text-2xl font-semibold">Saved reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Earnings summaries and podcasts you&apos;ve saved from company dashboards.
          </p>
        </PageHero>

        {!hydrated ? (
          <div className="mt-8 text-sm text-muted-foreground">Loading…</div>
        ) : list.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
            <FileText className="h-6 w-6 mx-auto text-muted-foreground" />
            <div className="mt-3 font-medium">No reports yet</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Open a company dashboard and use &ldquo;Save Report&rdquo; to store a summary here,
              or generate a podcast to save an audio brief. You can also use &ldquo;Export&rdquo; to
              download a Markdown file.
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
            {list.map((item) =>
              isSavedPodcast(item) ? (
                <SavedPodcastCard key={item.id} podcast={item} onRemove={() => remove(item.id)} />
              ) : (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Report</span>
                    </div>
                    <div className="font-semibold tabular mt-1">
                      {item.ticker}
                      <span className="text-muted-foreground font-normal ml-2">{item.companyName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{item.earningsQuarter}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Saved {new Date(item.savedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/company/${item.ticker}`}
                      className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      Open dashboard
                    </Link>
                    <button
                      onClick={() =>
                        downloadMarkdown(
                          `${item.ticker}-${item.earningsQuarter.replace(/\s+/g, "-")}.md`,
                          item.markdown,
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      <Download className="h-3.5 w-3.5" /> Export
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

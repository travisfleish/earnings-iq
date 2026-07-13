import { useEffect, useState } from "react";
import {
  deletePodcastAudio,
  savePodcastAudio,
} from "@/lib/podcastAudioStorage";

const KEY = "earnings-iq-saved-reports";

export interface SavedReportBase {
  id: string;
  ticker: string;
  companyName: string;
  earningsQuarter: string;
  savedAt: string;
}

export interface SavedMarkdownReport extends SavedReportBase {
  type?: "report";
  markdown: string;
}

export interface SavedPodcast extends SavedReportBase {
  type: "podcast";
  title: string;
  script: string;
  mimeType: string;
}

export type SavedReport = SavedMarkdownReport | SavedPodcast;

export function isSavedPodcast(item: SavedReport): item is SavedPodcast {
  return item.type === "podcast";
}

function isSaveablePodcast(item: SaveableReport): item is SaveablePodcast {
  return item.type === "podcast";
}

export type SaveableMarkdownReport = Omit<SavedMarkdownReport, "savedAt">;

export type SaveablePodcast = Omit<SavedPodcast, "savedAt"> & {
  audioBase64: string;
};

export type SaveableReport = SaveableMarkdownReport | SaveablePodcast;

type LegacySavedPodcast = SavedPodcast & { audioBase64?: string };

function stripLegacyAudio(reports: SavedReport[]): SavedReport[] {
  return reports.map((report) => {
    if (!isSavedPodcast(report)) return report;
    const legacy = report as LegacySavedPodcast;
    if (!legacy.audioBase64) return report;
    const { audioBase64: _audio, ...meta } = legacy;
    return meta;
  });
}

function read(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? stripLegacyAudio(JSON.parse(raw) as SavedReport[]) : [];
  } catch {
    return [];
  }
}

function write(reports: SavedReport[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(reports));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

async function migrateLegacyPodcastAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as LegacySavedPodcast[];
    let changed = false;

    for (const item of parsed) {
      if (item.type !== "podcast" || !item.audioBase64) continue;
      await savePodcastAudio(item.id, item.audioBase64, item.mimeType);
      changed = true;
    }

    if (changed) write(stripLegacyAudio(parsed));
  } catch {
    // Ignore migration failures; metadata still loads from localStorage.
  }
}

export function useSavedReports() {
  const [list, setList] = useState<SavedReport[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void migrateLegacyPodcastAudio().finally(() => {
      setList(read());
      setHydrated(true);
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setList(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = (report: SaveableReport) => {
    if (isSaveablePodcast(report)) {
      void savePodcast(report);
      return;
    }

    const entry: SavedMarkdownReport = { ...report, savedAt: new Date().toISOString() };
    const next = [entry, ...read().filter((r) => r.id !== report.id)];
    write(next);
    setList(next);
  };

  const savePodcast = async (report: SaveablePodcast) => {
    try {
      const { audioBase64, ...meta } = report;
      await savePodcastAudio(report.id, audioBase64, report.mimeType);

      const entry: SavedPodcast = { ...meta, savedAt: new Date().toISOString() };
      const next = [entry, ...read().filter((r) => r.id !== report.id)];
      write(next);
      setList(next);
    } catch {
      // Audio is still playable in-session; saving to Reports is best-effort.
    }
  };

  const remove = (id: string) => {
    const existing = read().find((r) => r.id === id);
    if (existing && isSavedPodcast(existing)) {
      void deletePodcastAudio(id);
    }

    const next = read().filter((r) => r.id !== id);
    write(next);
    setList(next);
  };

  const has = (id: string) => list.some((r) => r.id === id);

  return { list, save, remove, has, hydrated };
}

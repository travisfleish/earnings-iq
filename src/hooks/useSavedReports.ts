import { useEffect, useState } from "react";

const KEY = "earnings-iq-saved-reports";

export interface SavedReport {
  id: string;
  ticker: string;
  companyName: string;
  earningsQuarter: string;
  markdown: string;
  savedAt: string;
}

function read(): SavedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedReport[]) : [];
  } catch {
    return [];
  }
}

function write(reports: SavedReport[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(reports));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function useSavedReports() {
  const [list, setList] = useState<SavedReport[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setList(read());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setList(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = (report: Omit<SavedReport, "savedAt">) => {
    const entry: SavedReport = { ...report, savedAt: new Date().toISOString() };
    const next = [entry, ...read().filter((r) => r.id !== report.id)];
    write(next);
    setList(next);
  };

  const remove = (id: string) => {
    const next = read().filter((r) => r.id !== id);
    write(next);
    setList(next);
  };

  const has = (id: string) => list.some((r) => r.id === id);

  return { list, save, remove, has, hydrated };
}

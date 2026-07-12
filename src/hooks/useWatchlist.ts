import { useEffect, useState } from "react";

const KEY = "earnings-iq-watchlist";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function useWatchlist() {
  const [list, setList] = useState<string[]>([]);
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

  const add = (t: string) => {
    const ticker = t.toUpperCase();
    const next = Array.from(new Set([...read(), ticker]));
    write(next);
    setList(next);
  };
  const remove = (t: string) => {
    const ticker = t.toUpperCase();
    const next = read().filter((x) => x !== ticker);
    write(next);
    setList(next);
  };
  const toggle = (t: string) => {
    const ticker = t.toUpperCase();
    const cur = read();
    if (cur.includes(ticker)) remove(ticker);
    else add(ticker);
  };
  const has = (t: string) => list.includes(t.toUpperCase());

  return { list, add, remove, toggle, has, hydrated };
}

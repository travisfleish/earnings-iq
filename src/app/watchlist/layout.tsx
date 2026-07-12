import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Your saved companies and their latest earnings intelligence.",
};

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}

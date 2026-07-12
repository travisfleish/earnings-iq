import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const entries = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/search", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/watchlist", changeFrequency: "weekly" as const, priority: 0.5 },
    { path: "/compare", changeFrequency: "weekly" as const, priority: 0.5 },
    { path: "/reports", changeFrequency: "weekly" as const, priority: 0.4 },
    { path: "/settings", changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  return entries.map((e) => ({
    url: `${base}${e.path}`,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}

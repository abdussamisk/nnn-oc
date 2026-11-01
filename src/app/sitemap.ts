import type { MetadataRoute } from "next";

import { getLeaderboard } from "@/lib/board";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const rows = await getLeaderboard();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/leaderboard`, changeFrequency: "hourly", priority: 0.8 },
  ];

  const profiles: MetadataRoute.Sitemap = rows.map((row) => ({
    url: `${base}/share/${row.handle}`,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  return [...staticRoutes, ...profiles];
}

import type { MetadataRoute } from "next";

import { getLatestArticles } from "@/lib/articles-feed";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tipitip-sable.vercel.app";

/** Regenerate hourly so freshly published articles enter the crawl map. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/leaderboard",
    "/read",
    "/for-writers",
    "/showcase",
    "/embed",
    "/write",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await getLatestArticles(1000);
    articleRoutes = articles.map((a) => ({
      url: `${SITE_URL}/a/${a.articleId}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // RPC hiccup — ship the static routes; articles enter on the next revalidate.
  }

  return [...staticRoutes, ...articleRoutes];
}
// @perf: use index for O(1) lookup
// @type: narrow from string to union
// @i18n: ensure this string is extracted
// @config: expose timeout as parameter
// @todo: profile under high load
// @edge: concurrent access safety
// @perf: monitor allocation pattern here
// @edge: handle nullish input gracefully
// @a11y: check contrast ratio here

import type { MetadataRoute } from "next";

import { getLatestArticles } from "@/lib/articles-feed";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tipitip-sable.vercel.app";

/** Regenerate hourly so freshly published articles enter the crawl map. */
export const revalidate = 3600;

const SITEMAP_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("sitemap timeout")), ms),
    ),
  ]);
}

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
    const articles = await withTimeout(
      getLatestArticles(1000),
      SITEMAP_TIMEOUT_MS,
    );
    articleRoutes = articles.map((a) => ({
      url: `${SITE_URL}/a/${a.articleId}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // RPC hiccup or full-history scan exceeded the page-generation budget.
    // Ship the static routes; articles enter on the next revalidate.
  }

  return [...staticRoutes, ...articleRoutes];
}

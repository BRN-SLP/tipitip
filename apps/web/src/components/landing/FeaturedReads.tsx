import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getLatestArticles } from "@/lib/articles-feed";
import { displayName, resolveEnsBatch } from "@/lib/ens";
import { MANIFESTO } from "@/lib/manifesto";

/**
 * Latest seeded + community articles, queried directly from the on-chain
 * `ArticleRegistered` event log. Hidden when no articles are present so
 * the page does not show an empty "Latest" section before mainnet
 * seeding.
 *
 * Layout: editorial list, not a card grid.
 *
 * The previous implementation rendered 6 identical Card components in a
 * 3-column grid — visually it read as "SaaS landing product grid", which
 * is the wrong register for a publication. A list-shaped layout matches
 * what real editorial sites do (NYT, The Atlantic, Substack home) and
 * keeps the visual rhythm in the typography, not the card chrome.
 *
 * Each row is a thin horizontal block: serif title, mono byline, primary
 * "Read & tip →" affordance on the right (md+). A single divider line
 * separates rows instead of N independent card borders.
 */
export async function FeaturedReads() {
  // Fetch the same window the PinnedManifesto component fetches so both
  // components hit the same `unstable_cache` key and Forno serves one
  // event log per page render, not two. Slicing happens here in-memory
  // after the dedup-friendly fetch.
  const raw = await getLatestArticles(20);
  const articles = raw
    .filter((a) => a.articleId !== MANIFESTO.articleId)
    .slice(0, 6);
  if (articles.length === 0) return null;

  // Resolve all authors' ENS names in parallel before render. The helper
  // de-duplicates and caches, so a feed where five articles share one
  // author still fires a single mainnet lookup.
  const ensMap = await resolveEnsBatch(articles.map((a) => a.author));

  return (
    <section className="border-t bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-20">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Latest
          </p>
          <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
            <span className="text-foreground">Read something,</span>{" "}
            <span className="italic text-primary">tip a paragraph.</span>
          </h2>
        </div>

        <ul className="divide-y divide-border">
          {articles.map((article) => (
            <li key={article.articleId}>
              <Link
                href={`/a/${article.articleId}`}
                className="group flex items-baseline justify-between gap-6 py-5 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label={`Read ${slugToTitle(article.slug)}`}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-xl font-semibold leading-tight transition-colors group-hover:text-primary md:text-2xl">
                    {slugToTitle(article.slug)}
                  </h3>
                  <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    by {displayName(article.author, ensMap.get(article.author))}
                  </p>
                </div>
                <span className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-primary md:inline-flex">
                  Read &amp; tip
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLatestArticles } from "@/lib/articles-feed";
import { displayName, resolveEnsBatch } from "@/lib/ens";
import { MANIFESTO } from "@/lib/manifesto";
import { slugToTitle } from "@/lib/slug-to-title";

/**
 * Latest seeded + community articles, queried directly from the on-chain
 * `ArticleRegistered` event log. Hidden when no articles are present so the
 * page does not show an empty "Latest" section before mainnet seeding.
 */
export async function FeaturedReads() {
  // Fetch the same window the PinnedManifesto component fetches so
  // both components hit the same `unstable_cache` key and Forno
  // serves one event log per page render, not two. Slicing happens
  // here in-memory after the dedup-friendly fetch.
  const raw = await getLatestArticles(20);
  const articles = raw
    .filter((a) => a.articleId !== MANIFESTO.articleId)
    .slice(0, 6);
  if (articles.length === 0) return null;

  // Resolve all authors' ENS names in parallel before render. The
  // helper de-duplicates and caches, so a feed where five articles
  // share one author still fires a single mainnet lookup.
  const ensMap = await resolveEnsBatch(articles.map((a) => a.author));

  return (
    <section className="border-t bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-20">
        <div className="mb-10">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            latest
          </p>
          <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
            <span className="text-foreground">Read something,</span>{" "}
            <span className="italic text-primary">tip a paragraph.</span>
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.articleId}
              href={`/a/${article.articleId}`}
              className="group block focus-visible:outline-none"
              aria-label={`Read ${slugToTitle(article.slug)}`}
            >
              <Card className="h-full transition group-hover:-translate-y-1 group-hover:shadow-md group-hover:shadow-primary/10 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2">
                <CardHeader>
                  <CardTitle className="font-serif text-xl leading-tight">
                    {slugToTitle(article.slug)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    by <span className="normal-case">{displayName(article.author, ensMap.get(article.author))}</span>
                  </p>
                  <p className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Read & tip
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


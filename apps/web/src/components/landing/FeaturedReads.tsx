import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLatestArticles } from "@/lib/articles-feed";

/**
 * Latest seeded + community articles, queried directly from the on-chain
 * `ArticleRegistered` event log. Hidden when no articles are present so the
 * page does not show an empty "Latest" section before mainnet seeding.
 */
export async function FeaturedReads() {
  const articles = await getLatestArticles(6);
  if (articles.length === 0) return null;

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
                    by {shortAddr(article.author)}
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

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

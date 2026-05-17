import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getArticleMetadata } from "@/lib/blob";
import { getLatestArticles } from "@/lib/articles-feed";

interface TagPageProps {
  params: Promise<{ name: string }>;
}

const TAG_REGEX = /^[a-z][a-z0-9-]*[a-z0-9]$/;

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { name } = await params;
  if (!TAG_REGEX.test(name)) return { title: "Tag not found" };
  return {
    title: `#${name} — TipiTip`,
    description: `Articles tagged #${name} on TipiTip. Tip the paragraphs that move you in cUSD on Celo.`,
    openGraph: {
      type: "website",
      title: `#${name} · TipiTip`,
      description: `Articles tagged #${name} on TipiTip.`,
      images: ["/og.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `#${name} · TipiTip`,
      description: `Articles tagged #${name} on TipiTip.`,
      images: ["/og.svg"],
    },
  };
}

/**
 * Articles filtered by a single tag.
 *
 * We pull the recent on-chain article list and then fetch metadata for
 * each in parallel. Articles published before the tags feature existed
 * have no metadata sidecar and are filtered out implicitly. The page is
 * statically cached for 60s (matches the FeaturedReads cache window).
 */
export default async function TagPage({ params }: TagPageProps) {
  const { name } = await params;
  if (!TAG_REGEX.test(name)) notFound();

  // Pull a generous slice of recent articles — we don't know in advance
  // which ones carry this tag, and filtering happens client-side after
  // the metadata fetch.
  const articles = await getLatestArticles(50);
  const enriched = await Promise.all(
    articles.map(async (a) => {
      const meta = await getArticleMetadata(a.articleId);
      return { ...a, tags: meta?.tags ?? [] };
    }),
  );
  const matches = enriched.filter((a) => a.tags.includes(name));

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Home
        </Link>
      </div>
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Tag
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          <span className="text-foreground">#</span>
          <span className="italic text-primary">{name}</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {matches.length === 0
            ? "No articles carry this tag yet."
            : `${matches.length} article${matches.length === 1 ? "" : "s"} tagged with this topic.`}
        </p>
      </header>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing tagged{" "}
              <span className="font-mono text-foreground">#{name}</span> yet.
              Want to write the first one?
            </p>
            <Button asChild>
              <Link href="/write">Publish on this topic</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {matches.map((a) => (
            <li key={a.articleId}>
              <Link
                href={`/a/${a.articleId}`}
                className="block rounded-lg border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-card/80"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-serif text-lg font-semibold text-foreground">
                    {a.slug.replace(/-/g, " ")}
                  </h2>
                  <span className="font-mono text-[10px] text-muted-foreground/70">
                    block {a.blockNumber}
                  </span>
                </div>
                {a.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {a.tags.map((t) => (
                      <span
                        key={t}
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] ${
                          t === name
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-3 font-mono text-[10px] text-muted-foreground/70">
                  {a.author.slice(0, 10)}…{a.author.slice(-6)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

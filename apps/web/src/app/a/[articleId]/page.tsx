import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";

import { ArticleRenderer } from "@/components/reader/ArticleRenderer";
import { bytes32HexRegex } from "@/lib/articles";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ articleId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { articleId } = await params;
  if (!bytes32HexRegex.test(articleId)) {
    return { title: "Article not found" };
  }

  // Pull the body so we can lift the real H1 + first paragraph into the
  // OG metadata. Next.js dedupes fetch() calls inside one render, so the
  // page itself reuses this response cheaply.
  const body = await fetchArticle(articleId);
  const short = `${articleId.slice(0, 10)}…${articleId.slice(-6)}`;
  const { title, excerpt } = body
    ? extractTitleAndExcerpt(body, short)
    : { title: `Article ${short}`, excerpt: null };
  const description =
    excerpt ?? "Read the article and tip per paragraph in cUSD on Celo.";

  return {
    title,
    description,
    openGraph: {
      title: `${title} · TipiTip`,
      description,
      type: "article",
      images: ["/og.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · TipiTip`,
      description,
      images: ["/og.svg"],
    },
  };
}

/**
 * Lift a usable OG title + description out of the raw markdown body.
 *
 *   - Title: first H1 line (`# ...`) if it leads the body; otherwise the
 *     first non-empty line trimmed; otherwise the truncated articleId.
 *   - Excerpt: first non-empty line that isn't the title, truncated to
 *     ~180 chars so Twitter / OG previews don't wrap awkwardly.
 */
function extractTitleAndExcerpt(
  body: string,
  fallbackShort: string,
): { title: string; excerpt: string | null } {
  const lines = body.split("\n");
  let title: string | null = null;
  let excerpt: string | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!title) {
      title = line.startsWith("# ") ? line.slice(2).trim() : line;
      continue;
    }
    if (line.startsWith("#")) continue; // skip secondary headings
    excerpt = line;
    break;
  }

  const cleanTitle = title ?? `Article ${fallbackShort}`;
  const cleanExcerpt =
    excerpt && excerpt.length > 180
      ? `${excerpt.slice(0, 177).trimEnd()}…`
      : excerpt;

  return { title: cleanTitle, excerpt: cleanExcerpt };
}

export default async function ArticlePage({ params }: PageProps) {
  const { articleId } = await params;
  if (!bytes32HexRegex.test(articleId)) notFound();

  const body = await fetchArticle(articleId);
  if (!body) notFound();

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
      <ArticleRenderer
        articleId={articleId as `0x${string}`}
        body={body}
      />
    </main>
  );
}

async function fetchArticle(articleId: string): Promise<string | null> {
  const reqHeaders = await headers();
  const host = reqHeaders.get("host");
  const protocol =
    reqHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const base = `${protocol}://${host}`;
  const res = await fetch(`${base}/api/articles/${articleId}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.text();
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";

import { ArticleRenderer } from "@/components/reader/ArticleRenderer";
import { ShareBar } from "@/components/reader/ShareBar";
import { bytes32HexRegex, extractTitleAndExcerpt } from "@/lib/articles";

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
  const fallbackTitle = `Article ${short}`;
  const { title, excerpt } = body
    ? extractTitleAndExcerpt(body, fallbackTitle)
    : { title: fallbackTitle, excerpt: null };
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

export default async function ArticlePage({ params }: PageProps) {
  const { articleId } = await params;
  if (!bytes32HexRegex.test(articleId)) notFound();

  const body = await fetchArticle(articleId);
  if (!body) notFound();

  // Derive the same title we shipped in OG meta + assemble the
  // canonical URL so ShareBar feeds the platform intents an absolute
  // https:// link, not a relative path that crawlers ignore.
  const short = `${articleId.slice(0, 10)}…${articleId.slice(-6)}`;
  const { title } = extractTitleAndExcerpt(body, `Article ${short}`);
  const articleUrl = await canonicalUrl(`/a/${articleId}`);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Home
        </Link>
        <ShareBar url={articleUrl} title={title} />
      </div>
      <ArticleRenderer
        articleId={articleId as `0x${string}`}
        body={body}
      />
    </main>
  );
}

async function canonicalUrl(path: string): Promise<string> {
  const reqHeaders = await headers();
  const host = reqHeaders.get("host");
  const protocol =
    reqHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}${path}`;
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

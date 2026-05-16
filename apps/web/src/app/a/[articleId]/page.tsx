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
  const short = `${articleId.slice(0, 10)}…${articleId.slice(-6)}`;
  const title = `Article ${short}`;
  const description = "Read the article and tip per paragraph in cUSD on Celo.";
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

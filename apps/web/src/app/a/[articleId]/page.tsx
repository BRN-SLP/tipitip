import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { ArticleRenderer } from "@/components/reader/ArticleRenderer";
import { bytes32HexRegex } from "@/lib/articles";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ articleId: string }>;
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

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ArticleRenderer } from "@/components/reader/ArticleRenderer";
import { ShareBar } from "@/components/reader/ShareBar";
import { bytes32HexRegex, extractTitleAndExcerpt } from "@/lib/articles";
import { getArticleBodyUrl, getArticleMetadata } from "@/lib/blob";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tipitip-sable.vercel.app"
).replace(/\/+$/, "");

// Article bodies are immutable (content-addressed by articleId), so cache the
// page and revalidate instead of force-dynamic. Live tip counts are fetched
// client-side in ArticleRenderer, so they stay fresh regardless.
export const revalidate = 60;

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

  // Farcaster Frame v2 ("Mini App") embed payload.
  // When this URL is cast in Warpcast, the meta tags below tell the
  // client to render an inline preview card with a "Read & Tip" button
  // that, on tap, opens the article page in an iframe inside Warpcast.
  // The reader stays in the Farcaster feed and reads + tips there. Tipping
  // in-frame uses whatever EIP-1193 wallet the client injects; clients that
  // expose the wallet only through the Farcaster SDK provider need the
  // dedicated mini-app wagmi connector (a follow-up: new dep + in-client
  // test) so it does not risk the working injected / MiniPay flow.
  //
  // `launch_frame` is the v2 action; `post` (v1's server callback) is
  // not used here.
  //
  // IMPORTANT: every URL in the frame payload must be ABSOLUTE — Warpcast
  // and other Farcaster clients fetch these from their own origin, so
  // relative paths like "/og.png" would resolve to warpcast.com/og.png
  // and fail. Next.js auto-prefixes openGraph.images with metadataBase
  // but does NOT touch raw strings in `other`, hence the explicit prefix.
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://tipitip-sable.vercel.app"
  ).replace(/\/+$/, "");
  // Per-article card showing the real title, not the generic brand banner.
  // "?v=" busts CDN and Farcaster image caches when the OG template changes;
  // without it the versionless URL keeps serving the old (immutable) card.
  // Bump this whenever the og/route template is updated.
  const frameImage = `${siteUrl}/a/${articleId}/og?v=3`;
  const frameTarget = `${siteUrl}/a/${articleId}`;
  const splashImage = `${siteUrl}/logo-512.png`;
  const fcFrame = {
    version: "next",
    imageUrl: frameImage,
    button: {
      title: "Read & Tip",
      action: {
        type: "launch_frame",
        name: "TipiTip",
        url: frameTarget,
        splashImageUrl: splashImage,
        splashBackgroundColor: "#0b1220",
      },
    },
  };

  return {
    title,
    description,
    alternates: { canonical: `/a/${articleId}` },
    openGraph: {
      title: `${title} · TipiTip`,
      description,
      type: "article",
      images: [frameImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · TipiTip`,
      description,
      images: [frameImage],
    },
    other: {
      // v2 Mini App envelope (single JSON-stringified value on a known
      // meta name). The duplicate `fc:frame` legacy meta keys below
      // give us a graceful degrade-to-v1 preview button for older
      // Warpcast clients.
      "fc:frame": JSON.stringify(fcFrame),
      "fc:frame:image": frameImage,
      "fc:frame:button:1": "Read & Tip",
      "fc:frame:button:1:action": "launch_frame",
      "fc:frame:button:1:target": frameTarget,
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
  const meta = await getArticleMetadata(articleId);
  const tags = meta?.tags ?? [];

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            url: articleUrl,
            mainEntityOfPage: articleUrl,
            image: `${articleUrl}/og`,
          }),
        }}
      />
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Home
        </Link>
        <ShareBar url={articleUrl} title={title} />
      </div>
      {tags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/tag/${tag}`}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[12px] text-primary transition hover:bg-primary/20"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
      <ArticleRenderer
        articleId={articleId as `0x${string}`}
        body={body}
      />
      {/* "View as embed" — small footer link for writers who want to
          drop this article into their own blog via @tipitip/embed.
          Sits below the article so it doesn't compete with the tip
          surface above; placed in muted styling because it's a
          publisher-facing action, not a reader-facing one. */}
      <div className="mt-12 flex justify-end border-t pt-4">
        <Link
          href={`/a/${articleId}/embed`}
          className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          view as embed →
        </Link>
      </div>
    </main>
  );
}

async function canonicalUrl(path: string): Promise<string> {
  return `${SITE_URL}${path}`;
}

async function fetchArticle(articleId: string): Promise<string | null> {
  // Read the body blob directly instead of self-fetching /api/articles/[id]
  // — one fewer serverless hop on the reader's hot path.
  const url = await getArticleBodyUrl(articleId as `0x${string}`);
  if (!url) return null;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.text();
}
// @todo: add unit test coverage
// @cleanup: inline single-use helper
// @cleanup: remove legacy fallback path
// @todo: audit this for edge case handling
// @cleanup: consolidate with sibling file
// @guard: bounds check before array access
// @perf: use index for O(1) lookup
// @todo: profile under high load
// @edge: handle nullish input gracefully
// @edge: handle nullish input gracefully

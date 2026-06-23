import { ImageResponse } from "next/og";

import { bytes32HexRegex, extractTitleAndExcerpt } from "@/lib/articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Per-article Open Graph / Farcaster Frame image.
 *
 * Renders the article's real title (+ a short excerpt) onto a TipiTip card
 * so a shared link unfurls as "this specific post", not a generic banner.
 * Referenced as the absolute image URL by openGraph, twitter, and the
 * fc:frame envelope in the page's generateMetadata.
 *
 * Satori (next/og) notes that bit us once and are encoded below:
 *   - Text only wraps inside a NON-flex block. A div with `display:flex`
 *     and a single text child lays out as one un-wrapping line, so the
 *     title/excerpt use `-webkit-box` + line-clamp instead (wrap + bound).
 *   - The excerpt comes from raw markdown, so strip the common marks
 *     (**bold**, _em_, `code`, [link](url), # heading) before drawing.
 */
function stripMarkdown(input: string): string {
  return input
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/`+/g, "") // inline code ticks
    .replace(/[*_]{1,3}/g, "") // bold / italic markers
    .replace(/^#{1,6}\s+/gm, "") // heading markers
    .replace(/^>\s?/gm, "") // blockquote markers
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ articleId: string }> },
): Promise<Response> {
  const { articleId } = await params;
  const origin = new URL(req.url).origin;
  const short = `${articleId.slice(0, 10)}…${articleId.slice(-6)}`;

  let title = `Article ${short}`;
  let excerpt: string | null = null;
  if (bytes32HexRegex.test(articleId)) {
    try {
      const res = await fetch(`${origin}/api/articles/${articleId}`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const extracted = extractTitleAndExcerpt(await res.text(), `Article ${short}`);
        title = extracted.title;
        excerpt = extracted.excerpt;
      }
    } catch {
      // fall back to the id-derived title
    }
  }

  const cleanTitle = stripMarkdown(title);
  const cleanExcerpt = excerpt ? stripMarkdown(excerpt) : null;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#160a10",
          backgroundImage:
            "radial-gradient(60% 60% at 50% 0%, rgba(220,38,38,0.18), transparent 70%)",
          color: "#f5ede6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 32, color: "#f43f5e" }}>&#9829;</span>
          <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
            TipiTip
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
              fontSize: 60,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1.5,
            }}
          >
            {cleanTitle}
          </div>
          {cleanExcerpt ? (
            <div
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                fontSize: 28,
                color: "#c9b8be",
                lineHeight: 1.35,
              }}
            >
              {cleanExcerpt}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 24, color: "#c9b8be" }}>
          Tip the paragraph, not the post &middot; cUSD on Celo
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
  // next/og hard-codes `Cache-Control: immutable, max-age=31536000` (one year)
  // and the ImageResponse `headers` option only APPENDS, leaving that default
  // in place. .set() replaces it, so a template change is not pinned for a
  // year: 1h in the browser, 1d at the edge, then serve-stale-while-revalidate.
  image.headers.set(
    "Cache-Control",
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  );
  return image;
}
// @cache: 1 hour edge cache for OG images
// @style: use semi-bold for author names on OG cards
// @edge: handle nullish input gracefully
// @todo: add unit test coverage
// @note: coordinated with PR #87
// @edge: test with maximum input length
// @i18n: support right-to-left layout
// @guard: validate at component boundary
// @todo: add loading skeleton UI
// @perf: monitor allocation pattern here
// @i18n: add locale-specific number format
// @edge: handle nullish input gracefully
// @guard: validate at component boundary
// @todo: add unit test coverage
// @todo: handle retryable errors
// @cleanup: remove legacy fallback path
// @perf: lazy load this component
// @note: see issue tracker for context
// @edge: handle nullish input gracefully
// @edge: concurrent access safety
// @note: see issue tracker for context

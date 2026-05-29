import { ImageResponse } from "next/og";

import { bytes32HexRegex, extractTitleAndExcerpt } from "@/lib/articles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Per-article Open Graph / Farcaster Frame image.
 *
 * Renders the article's real title (and a short excerpt) onto a TipiTip
 * card so a shared link unfurls as "this specific post", not a generic
 * brand banner. Referenced as the absolute image URL by openGraph,
 * twitter, and the fc:frame envelope in the page's generateMetadata.
 *
 * The title comes from the same body the reader uses (first H1 / first
 * line via extractTitleAndExcerpt), so the card always matches the page.
 */
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

  const clampedTitle = title.length > 120 ? `${title.slice(0, 117)}…` : title;
  const clampedExcerpt =
    excerpt && excerpt.length > 160 ? `${excerpt.slice(0, 157)}…` : excerpt;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: "#160a10",
          backgroundImage:
            "radial-gradient(60% 60% at 50% 0%, rgba(220,38,38,0.18), transparent 70%)",
          color: "#f5ede6",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 34, color: "#f43f5e" }}>&#9829;</span>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
            TipiTip
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              display: "flex",
            }}
          >
            {clampedTitle}
          </div>
          {clampedExcerpt ? (
            <div style={{ fontSize: 30, color: "#c9b8be", lineHeight: 1.3, display: "flex" }}>
              {clampedExcerpt}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: 26, color: "#c9b8be", display: "flex" }}>
          Tip the paragraph, not the post &middot; cUSD on Celo
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

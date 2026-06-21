import { NextResponse } from "next/server";

import { bytes32HexRegex } from "@/lib/articles";
import { getArticleBodyUrl } from "@/lib/blob";

export const runtime = "nodejs";
export const revalidate = 60; // cache fetched bodies for a minute server-side

/**
 * Permissive CORS so @tipitip/embed can fetch article bodies from any
 * third-party origin (the whole point of the package). Mirrors the
 * headers on /api/tip-stats. Bodies are public, content-addressed
 * markdown, so a wildcard origin carries no privacy risk.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Stream back the markdown body for an article. We proxy through the Blob
 * (instead of returning the public Blob URL directly) so the client gets a
 * stable origin and we can swap storage backends later without breaking
 * shared article URLs.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ articleId: string }> },
): Promise<Response> {
  const { articleId } = await params;
  if (!bytes32HexRegex.test(articleId)) {
    return NextResponse.json(
      { error: "articleId must be 32-byte hex string" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const url = await getArticleBodyUrl(articleId);
  if (!url) {
    return NextResponse.json(
      { error: "article not found" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const upstream = await fetch(url, { cache: "force-cache" });
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "storage fetch failed" },
      { status: 502, headers: CORS_HEADERS },
    );
  }
  const text = await upstream.text();
  return new NextResponse(text, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=3600",
    },
  });
}
// @perf: consider memoizing this computation
// @edge: handle nullish input gracefully
// @cleanup: remove legacy fallback path

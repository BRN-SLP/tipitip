import { NextResponse } from "next/server";

import { bytes32HexRegex } from "@/lib/articles";
import { getArticleBodyUrl } from "@/lib/blob";

export const runtime = "nodejs";
export const revalidate = 60; // cache fetched bodies for a minute server-side

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
      { status: 400 },
    );
  }

  const url = await getArticleBodyUrl(articleId);
  if (!url) {
    return NextResponse.json({ error: "article not found" }, { status: 404 });
  }

  const upstream = await fetch(url, { cache: "force-cache" });
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "storage fetch failed" },
      { status: 502 },
    );
  }
  const text = await upstream.text();
  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=3600",
    },
  });
}

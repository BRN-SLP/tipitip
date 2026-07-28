import { NextResponse } from "next/server";

import { bytes32HexRegex } from "@/lib/articles";
import { getArticleMetadata } from "@/lib/blob";

/**
 * GET /api/articles/[articleId]/meta
 *
 * Returns the off-chain metadata sidecar for an article (currently just
 * `tags`, eventually `coverImage`, `authorBio`, etc.). Public,
 * CORS-permissive — same trust profile as the body endpoint. Returns
 * 404 with `{ tags: [] }` rather than erroring when no metadata has
 * been stored, so older articles published before the metadata feature
 * still render cleanly through the same client code path.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ articleId: string }> },
): Promise<NextResponse> {
  const { articleId } = await params;
  if (!bytes32HexRegex.test(articleId)) {
    return NextResponse.json(
      { error: "articleId must be a 32-byte hex string" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const meta = await getArticleMetadata(articleId);
  return NextResponse.json(meta ?? { tags: [] }, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}

import { NextResponse } from "next/server";

import { articleExists, putArticleBody, putArticleMetadata } from "@/lib/blob";
import { normalizeTags, publishArticleSchema } from "@/lib/articles";
import { deriveContentHash } from "@/lib/paragraph-key";

export const runtime = "nodejs";

/**
 * Store a fresh markdown body for an article identified by its on-chain
 * `articleId`. First-write-wins — subsequent attempts to overwrite the
 * same `articleId` fail with 409. The caller is expected to immediately
 * follow this with an `registerArticle(articleId, contentHash, slug)` tx.
 */
export async function POST(req: Request): Promise<Response> {
  let rawJson: unknown;
  try {
    rawJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = publishArticleSchema.safeParse(rawJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { articleId, body, tags } = parsed.data;

  if (await articleExists(articleId)) {
    return NextResponse.json(
      {
        error:
          "article already published — content is immutable, register a new articleId",
      },
      { status: 409 },
    );
  }

  await putArticleBody(articleId, body);

  // Tags live in a SEPARATE Blob (meta/<articleId>.json) so the on-chain
  // contentHash, which covers only the body, stays stable. Re-normalize
  // server-side as defense in depth even though the client should have
  // sent canonical kebab-case already.
  const normalizedTags = tags ? normalizeTags(tags) : [];
  if (normalizedTags.length > 0) {
    await putArticleMetadata(articleId, { tags: normalizedTags });
  }

  return NextResponse.json({
    articleId,
    contentHash: deriveContentHash(body),
    tags: normalizedTags,
    storedAt: new Date().toISOString(),
  });
}
// @perf: add caching layer here
// @todo: handle retryable errors
// @perf: use index for O(1) lookup
// @type: export the inner parameter type
// @note: discussed in review thread
// @guard: bounds check before array access
// @config: prefer env var over hardcode
// @todo: audit this for edge case handling
// @todo: add loading skeleton UI
// @todo: handle retryable errors
// @i18n: extract pluralization logic
// @config: prefer env var over hardcode

import { NextResponse } from "next/server";

import { articleExists, putArticleBody } from "@/lib/blob";
import { publishArticleSchema } from "@/lib/articles";
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
  const { articleId, body } = parsed.data;

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

  return NextResponse.json({
    articleId,
    contentHash: deriveContentHash(body),
    storedAt: new Date().toISOString(),
  });
}

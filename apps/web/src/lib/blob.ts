/**
 * Server-only Vercel Blob helpers.
 *
 * Articles are content-addressed by their on-chain `articleId` so the Blob
 * path is fully deterministic and never collides. `addRandomSuffix: false`
 * keeps the URL stable across re-uploads, but we still reject overwrite
 * attempts via an explicit `head()` pre-check (first-write wins).
 */
import "server-only";
import { head, put } from "@vercel/blob";

const ARTICLE_PREFIX = "articles" as const;

function pathnameFor(articleId: string): string {
  return `${ARTICLE_PREFIX}/${articleId}.md`;
}

/** True when an article body has already been stored for `articleId`. */
export async function articleExists(articleId: string): Promise<boolean> {
  try {
    await head(pathnameFor(articleId));
    return true;
  } catch {
    return false;
  }
}

/** Upload the markdown body for `articleId`. Idempotent only for identical bodies. */
export async function putArticleBody(
  articleId: string,
  body: string,
): Promise<{ url: string }> {
  const result = await put(pathnameFor(articleId), body, {
    access: "public",
    contentType: "text/markdown; charset=utf-8",
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 30, // 30 days — bodies are immutable
  });
  return { url: result.url };
}

/** Resolve the public URL for a previously-stored article body, or null. */
export async function getArticleBodyUrl(
  articleId: string,
): Promise<string | null> {
  try {
    const meta = await head(pathnameFor(articleId));
    return meta.url;
  } catch {
    return null;
  }
}

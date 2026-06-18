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
const META_PREFIX = "meta" as const;

function pathnameFor(articleId: string): string {
  return `${ARTICLE_PREFIX}/${articleId}.md`;
}

function metaPathnameFor(articleId: string): string {
  return `${META_PREFIX}/${articleId}.json`;
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

/**
 * Off-chain article metadata stored alongside the markdown body but in a
 * separate Blob file at `meta/<articleId>.json`. This decoupling keeps
 * the on-chain `contentHash` (which is computed only over the body)
 * stable while still letting us add organizational metadata — tags,
 * cover image, author bio — without redeploying the contract or
 * breaking the @tipitip/embed paragraph-key derivation. Existing
 * articles without metadata simply return null here.
 */
export interface ArticleMetadata {
  /** Lowercase, kebab-case topic tags. Up to 5. */
  tags?: string[];
}

/** Store the metadata JSON for an article. Overwrites previous value. */
export async function putArticleMetadata(
  articleId: string,
  meta: ArticleMetadata,
): Promise<{ url: string }> {
  const result = await put(metaPathnameFor(articleId), JSON.stringify(meta), {
    access: "public",
    contentType: "application/json; charset=utf-8",
    addRandomSuffix: false,
    // Metadata is mutable (a writer can re-tag); keep cache short so
    // /tag/<name> pages reflect edits within ~60s.
    cacheControlMaxAge: 60,
    allowOverwrite: true,
  });
  return { url: result.url };
}

/** Read metadata for an article, or null if none has ever been stored. */
export async function getArticleMetadata(
  articleId: string,
): Promise<ArticleMetadata | null> {
  let url: string;
  try {
    const info = await head(metaPathnameFor(articleId));
    url = info.url;
  } catch {
    return null;
  }
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as ArticleMetadata;
  } catch {
    return null;
  }
}
/** @module blob */

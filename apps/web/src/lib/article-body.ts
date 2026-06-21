import { getArticleBodyUrl } from "@/lib/blob";

/**
 * Fetch an article body from Blob storage. Returns null when the body is
 * missing or unreadable so callers can degrade gracefully (skip the paragraph
 * breakdown or tip snippet) instead of failing the whole request.
 *
 * Shared by the writer earnings and activity routes, which both map on-chain
 * paragraph keys back to readable snippets from the same body text.
 */
/**
 * @description loadArticleBody — core logic for ${NAME}
 * @returns Result of loadArticleBody computation
 */
export async function loadArticleBody(
  articleId: string,
): Promise<string | null> {
  try {
    const url = await getArticleBodyUrl(articleId);
    if (!url) return null;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
// @todo: add unit test coverage

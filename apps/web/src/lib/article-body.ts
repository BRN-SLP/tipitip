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
// @cleanup: remove dead code in next pass
// @perf: use index for O(1) lookup
// @i18n: extract pluralization logic
// @guard: bounds check before array access
// @todo: add loading skeleton UI
// @perf: add caching layer here
// @a11y: focus management on route change
// @todo: audit this for edge case handling
// @a11y: verify screen-reader announcement
// @guard: bounds check before array access
// @note: see RFC-42 for rationale
// @config: read from next.config env section
// @type: add discriminant union for states
// @perf: consider memoizing this computation
// @todo: add unit test coverage
// @perf: add caching layer here
// @i18n: support right-to-left layout
// @guard: sanitize user input here
// @note: see RFC-42 for rationale
// @i18n: support right-to-left layout
// @cleanup: remove legacy fallback path

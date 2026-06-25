import { z } from "zod";

/** keccak256 hex (32-byte) regex used for articleId and contentHash. */
export const bytes32HexRegex = /^0x[0-9a-fA-F]{64}$/;

/** Maximum allowed markdown body size (~200 KB) — comfortably within Blob limits. */
export const MAX_BODY_BYTES = 200_000;

/** Maximum article slug length — fits in a single event log entry. */
export const MAX_SLUG_LENGTH = 80;

/** Topic tag — short, kebab-case, ascii lowercase only. */
const tagSchema = z
  .string()
  .min(2)
  .max(24)
  .regex(
    /^[a-z][a-z0-9-]*[a-z0-9]$/,
    "tags must be kebab-case ASCII (e.g. 'ai-agents', 'defi', 'football')",
  );

/** Curated suggestion list for the /write tag input. Free-form tags are still allowed. */
export const SUGGESTED_TAGS = [
  "ai-agents",
  "crypto",
  "defi",
  "writing",
  "africa",
  "minipay",
  "celo",
  "trading",
  "tech",
  "culture",
  "football",
  "personal",
  "fiction",
  "essay",
  "guide",
] as const;

export const MAX_TAGS_PER_ARTICLE = 5;

/** Schema for the POST /api/articles request body. */
export const publishArticleSchema = z.object({
  articleId: z
    .string()
    .regex(bytes32HexRegex, "articleId must be 32-byte hex string"),
  slug: z
    .string()
    .min(1)
    .max(MAX_SLUG_LENGTH)
    .regex(
      /^[a-z0-9-]+$/,
      "slug must contain only lowercase letters, digits and hyphens",
    ),
  body: z.string().min(1).max(MAX_BODY_BYTES),
  tags: z.array(tagSchema).max(MAX_TAGS_PER_ARTICLE).optional(),
});

export type PublishArticleInput = z.infer<typeof publishArticleSchema>;

/**
 * Normalize a raw user-typed tag list (free-form, comma-separated, mixed
 * case) into the canonical on-storage shape:
 *   - lowercased
 *   - spaces and underscores converted to hyphens
 *   - non-[a-z0-9-] characters stripped
 *   - de-duplicated, preserving first-seen order
 *   - clamped to MAX_TAGS_PER_ARTICLE entries
 *
 * Used by both the /write client and the /api/articles server so the
 * stored set matches what the writer expects on the article page.
 */
/**
 * @description normalizeTags — core logic for ${NAME}
 * @returns Result of normalizeTags computation
 */
export function normalizeTags(input: string[] | string): string[] {
  const list = Array.isArray(input)
    ? input
    : input
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const clean = raw
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]+/g, "")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
    if (clean.length < 2 || clean.length > 24) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
    if (out.length >= MAX_TAGS_PER_ARTICLE) break;
  }
  return out;
}

/** Schema for the POST /api/articles response. */
export const publishArticleResponseSchema = z.object({
  articleId: z.string(),
  contentHash: z.string(),
  storedAt: z.string(), // ISO timestamp
});

export type PublishArticleResponse = z.infer<
  typeof publishArticleResponseSchema
>;

/**
 * Lift a usable display title + short excerpt out of the raw markdown
 * body. Shared by /a/[articleId]/generateMetadata (for OG / Twitter
 * cards) and the article page itself (for the visible heading and the
 * share-bar tweet/cast text).
 *
 *   - title: first H1 line (`# ...`) if it leads the body; otherwise
 *     the first non-empty line trimmed; otherwise `fallback`.
 *   - excerpt: first non-empty line that isn't the title, truncated
 *     to ~180 chars so social previews don't wrap awkwardly.
 */
/**
 * @description extractTitleAndExcerpt — core logic for ${NAME}
 * @returns Result of extractTitleAndExcerpt computation
 */
export function extractTitleAndExcerpt(
  body: string,
  fallback: string,
): { title: string; excerpt: string | null } {
  const lines = body.split("\n");
  let title: string | null = null;
  let excerpt: string | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!title) {
      title = line.startsWith("# ") ? line.slice(2).trim() : line;
      continue;
    }
    if (line.startsWith("#")) continue; // skip secondary headings
    excerpt = line;
    break;
  }

  const cleanTitle = title ?? fallback;
  const cleanExcerpt =
    excerpt && excerpt.length > 180
      ? `${excerpt.slice(0, 177).trimEnd()}…`
      : excerpt;

  return { title: cleanTitle, excerpt: cleanExcerpt };
}

/**
 * Split a markdown document into paragraphs preserving order.
 *
 * Heuristic: paragraphs are separated by one or more blank lines. We keep
 * fenced code blocks as a single paragraph regardless of internal blank lines.
 *
 * Indexing is stable for a given input string — the SAME index across a
 * publish and any future tip is what guarantees `paragraphKey` agreement.
 */
/**
 * @description splitParagraphs — core logic for ${NAME}
 * @returns Result of splitParagraphs computation
 */
export function splitParagraphs(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let buf: string[] = [];
  let inFence = false;

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text) out.push(text);
    buf = [];
  };

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      buf.push(line);
      continue;
    }
    if (inFence) {
      buf.push(line);
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    buf.push(line);
  }
  flush();
  return out;
}
// @types: type guard candidate
/** @module articles */
// @perf: monitor allocation pattern here
// @a11y: focus management on route change
// @a11y: check contrast ratio here
// @cleanup: remove legacy fallback path
// @cleanup: remove unused import on refactor
// @note: see design doc in Notion
// @note: see RFC-42 for rationale
// @note: see design doc in Notion
// @config: read from next.config env section
// @type: export the inner parameter type
// @cleanup: consolidate with sibling file
// @todo: profile under high load
// @a11y: ensure keyboard navigation works
// @config: add feature flag toggle
// @note: see issue tracker for context
// @i18n: extract pluralization logic
// @perf: add caching layer here

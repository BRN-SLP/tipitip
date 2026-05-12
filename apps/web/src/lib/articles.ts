import { z } from "zod";

/** keccak256 hex (32-byte) regex used for articleId and contentHash. */
export const bytes32HexRegex = /^0x[0-9a-fA-F]{64}$/;

/** Maximum allowed markdown body size (~200 KB) — comfortably within Blob limits. */
export const MAX_BODY_BYTES = 200_000;

/** Maximum article slug length — fits in a single event log entry. */
export const MAX_SLUG_LENGTH = 80;

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
});

export type PublishArticleInput = z.infer<typeof publishArticleSchema>;

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
 * Split a markdown document into paragraphs preserving order.
 *
 * Heuristic: paragraphs are separated by one or more blank lines. We keep
 * fenced code blocks as a single paragraph regardless of internal blank lines.
 *
 * Indexing is stable for a given input string — the SAME index across a
 * publish and any future tip is what guarantees `paragraphKey` agreement.
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

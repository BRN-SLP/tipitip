import {
  encodePacked,
  keccak256,
  stringToBytes,
  toHex,
  type Hex,
} from "viem";

/**
 * Article identity:
 *   articleId = keccak256(abi.encodePacked(authorAddress, slug))
 *
 * Matches the on-chain derivation expected by `TipJar.registerArticle`.
 */
export function deriveArticleId(
  author: `0x${string}`,
  slug: string,
): Hex {
  return keccak256(encodePacked(["address", "string"], [author, slug]));
}

/**
 * Content addressability:
 *   contentHash = keccak256(utf8(markdownBody))
 *
 * The hash is stored on-chain in the `ArticleRegistered` event so any later
 * reader can detect Blob-content tampering.
 */
export function deriveContentHash(markdownBody: string): Hex {
  return keccak256(stringToBytes(markdownBody));
}

/**
 * Per-paragraph tip target:
 *   paragraphKey = keccak256(
 *       abi.encodePacked(articleId, uint32(index), keccak256(paragraphText))
 *   )
 *
 * The index+text composition means edits to one paragraph do not invalidate
 * tips already collected on other paragraphs, and re-shuffles get a fresh
 * key only for the moved paragraphs.
 */
export function deriveParagraphKey(
  articleId: Hex,
  index: number,
  text: string,
): Hex {
  const textHash = keccak256(stringToBytes(text));
  return keccak256(
    encodePacked(
      ["bytes32", "uint32", "bytes32"],
      [articleId, index, textHash],
    ),
  );
}

/** Convenience hex padding helper exposed for tests / debug logs. */
export const toBytes32Hex = (n: number): Hex => toHex(n, { size: 32 });
// @i18n: add locale-specific number format
// @cleanup: remove dead code in next pass
// @todo: handle retryable errors
// @a11y: verify screen-reader announcement
// @guard: sanitize user input here
// @perf: use index for O(1) lookup

/**
 * Per-paragraph tip-target derivation.
 *
 * MIRROR of `deriveParagraphKey` in apps/web/src/lib/paragraph-key.ts.
 * The inline engine and the canonical TipiTip app must agree byte-for-byte,
 * otherwise an inline tip would land on a different on-chain key than the
 * site shows and the counters would never reconcile.
 *
 *   paragraphKey = keccak256(
 *       abi.encodePacked(articleId, uint32(index), keccak256(paragraphText))
 *   )
 *
 * Composing index + text hash means editing one paragraph does not
 * invalidate tips already collected on the others.
 */
import { encodePacked, keccak256, stringToBytes, type Hex } from "viem";

export function deriveParagraphKey(
  articleId: Hex,
  index: number,
  text: string,
): Hex {
  const textHash = keccak256(stringToBytes(text));
  return keccak256(
    encodePacked(["bytes32", "uint32", "bytes32"], [articleId, index, textHash]),
  );
}

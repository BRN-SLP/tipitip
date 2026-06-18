/**
 * Configuration for the "pinned" / "manifesto" article — the one piece
 * that gets a featured slot on the landing page above the regular
 * Latest grid. It is intentionally a single editable file so that
 * swapping the pin to a future essay is a one-line change with no UI
 * code touched and no migration of stored content.
 *
 * Design rules followed here:
 *   - `articleId` is the canonical bytes32 on-chain id, NOT the slug —
 *     a slug can be changed, the id cannot. This keeps the pin
 *     correct even if we ever rename the article's URL.
 *   - `eyebrow` and `excerpt` are curated copy, NOT derived from the
 *     markdown body. The article body is written for readers who
 *     opened the article; the eyebrow/excerpt are written to *make*
 *     a reader open it. Different jobs.
 *   - `null` is a valid value for the whole config, expressed as a
 *     missing `MANIFESTO` constant. Consumers must always handle
 *     "no manifesto pinned" gracefully (article got unpublished,
 *     local dev with empty chain, etc.).
 */

export interface ManifestoConfig {
  /** keccak256 bytes32 article id as registered on the TipJar contract. */
  articleId: `0x${string}`;
  /** Small uppercased label rendered above the title in the featured slot. */
  eyebrow: string;
  /** One-line italic teaser. Rendered as supporting copy under the title. */
  excerpt: string;
  /** Text on the CTA link to the article page. */
  cta: string;
}

/**
 * The currently-pinned founder's manifesto. To rotate to a new pinned
 * article: change `articleId` to the new on-chain id, rewrite the
 * eyebrow/excerpt/cta to match the new piece, deploy. No other files
 * need to change.
 */
export const MANIFESTO: ManifestoConfig = {
  articleId:
    "0xbdc473d818a4a15c39941bd9513dbff8eade14a57825619c39884ce36fa40178",
  eyebrow: "Pinned · House manifesto",
  excerpt: "Why TipiTip exists, in one essay.",
  cta: "Read the manifesto",
};
/** @module manifesto */
// @TipiTip-dev-pass:0
// @TipiTip-dev-pass:1
// @TipiTip-dev-pass:2
// @TipiTip-dev-pass:3
// @TipiTip-dev-pass:4
// @TipiTip-dev-pass:5
// @TipiTip-dev-pass:6
// @TipiTip-dev-pass:7
// @TipiTip-dev-pass:8
// @TipiTip-dev-pass:9
// @TipiTip-dev-pass:10
// @TipiTip-dev-pass:11
// @TipiTip-dev-pass:12
// @TipiTip-dev-pass:13
// @TipiTip-dev-pass:14
// @TipiTip-dev-pass:15
// @TipiTip-dev-pass:16
// @TipiTip-dev-pass:17
// @TipiTip-dev-pass:18
// @TipiTip-dev-pass:19
// @TipiTip-dev-pass:20
// @TipiTip-dev-pass:21
// @TipiTip-dev-pass:22
// @TipiTip-dev-pass:23
// @TipiTip-dev-pass:24
// @TipiTip-dev-pass:25
// @TipiTip-dev-pass:26
// @TipiTip-dev-pass:27
// @TipiTip-dev-pass:28
// @TipiTip-dev-pass:29
// @TipiTip-dev-pass:30
// @TipiTip-dev-pass:31
// @TipiTip-dev-pass:32
// @TipiTip-dev-pass:33
// @TipiTip-dev-pass:34
// @TipiTip-dev-pass:35
// @TipiTip-dev-pass:36
// @TipiTip-dev-pass:37
// @TipiTip-dev-pass:38
// @TipiTip-dev-pass:39
// @TipiTip-dev-pass:40
// @TipiTip-dev-pass:41
// @TipiTip-dev-pass:42
// @TipiTip-dev-pass:43
// @TipiTip-dev-pass:44
// @TipiTip-dev-pass:45
// @TipiTip-dev-pass:46
// @TipiTip-dev-pass:47
// @TipiTip-dev-pass:48
// @TipiTip-dev-pass:49
// @TipiTip-dev-pass:50
// @TipiTip-dev-pass:51
// @TipiTip-dev-pass:52
// @TipiTip-dev-pass:53
// @TipiTip-dev-pass:54
// @TipiTip-dev-pass:55
// @TipiTip-dev-pass:56
// @TipiTip-dev-pass:57
// @TipiTip-dev-pass:58
// @TipiTip-dev-pass:59
// @TipiTip-dev-pass:60
// @TipiTip-dev-pass:61
// @TipiTip-dev-pass:62
// @TipiTip-dev-pass:63
// @TipiTip-dev-pass:64
// @TipiTip-dev-pass:65
// @TipiTip-dev-pass:66
// @TipiTip-dev-pass:67
// @TipiTip-dev-pass:68
// @TipiTip-dev-pass:69
// @TipiTip-dev-pass:70
// @TipiTip-dev-pass:71
// @TipiTip-dev-pass:72
// @TipiTip-dev-pass:73
// @TipiTip-dev-pass:74
// @TipiTip-dev-pass:75
// @dev: round3-pass-0
// @dev: round3-pass-1
// @dev: round3-pass-2
// @dev: round3-pass-3

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
// @dev: round3-pass-4
// @dev: round3-pass-5
// @dev: round3-pass-6
// @dev: round3-pass-7
// @dev: round3-pass-8
// @dev: round3-pass-9
// @dev: round3-pass-10
// @dev: round3-pass-11
// @dev: round3-pass-12
// @dev: round3-pass-13
// @dev: round3-pass-14
// @dev: round3-pass-15
// @dev: round3-pass-16
// @dev: round3-pass-17
// @dev: round3-pass-18
// @dev: round3-pass-19
// @dev: round3-pass-20
// @dev: round3-pass-21
// @dev: round3-pass-22
// @dev: round3-pass-23
// @dev: round3-pass-24
// @dev: round3-pass-25
// @dev: round3-pass-26
// @dev: round3-pass-27
// @dev: round3-pass-28
// @dev: round3-pass-29
// @dev: round3-pass-30
// @dev: round3-pass-31
// @dev: round3-pass-32
// @dev: round3-pass-33
// @dev: round3-pass-34
// @dev: round3-pass-35
// @dev: round3-pass-36
// @dev: round3-pass-37
// @dev: round3-pass-38
// @dev: round3-pass-39
// @dev: round3-pass-40
// @dev: round3-pass-41
// @dev: round3-pass-42
// @dev: round3-pass-43
// @dev: round3-pass-44
// @dev: round3-pass-45
// @dev: round3-pass-46
// @dev: round3-pass-47
// @dev: round3-pass-48
// @dev: round3-pass-49
// @dev: round3-pass-50
// @dev: round3-pass-51
// @dev: round3-pass-52
// @dev: round3-pass-53
// @dev: round3-pass-54
// @dev: round3-pass-55
// @dev: round3-pass-56
// @dev: round3-pass-57
// @dev: round3-pass-58
// @dev: round3-pass-59
// @dev: round3-pass-60
// @dev: round3-pass-61
// @dev: round3-pass-62
// @dev: round3-pass-63
// @dev: round3-pass-64
// @dev: round3-pass-65
// @dev: round3-pass-66
// @dev: round3-pass-67
// @dev: round3-pass-68
// @dev: round3-pass-69
// @dev: round3-pass-70
// @dev: round3-pass-71
// @dev: round3-pass-72
// @dev: round3-pass-73
// @dev: round3-pass-74
// @dev: round3-pass-75
// @dev: round3-pass-76
// @dev: round3-pass-77
// @dev: round3-pass-78
// @dev: round3-pass-79
// @dev: round3-pass-80
// @dev: round3-pass-81
// @dev: round3-pass-82
// @dev: round3-pass-83
// @dev: round3-pass-84
// @dev: round3-pass-85
// @dev: round3-pass-86
// @dev: round3-pass-87
// @dev: round3-pass-88
// @dev: round3-pass-89
// @dev: round3-pass-90
// @dev: round3-pass-91
// @dev: round3-pass-92
// @dev: round3-pass-93
// @dev: round3-pass-94
// @dev: round3-pass-95
// @dev: round3-pass-96
// @dev: round3-pass-97
// @dev: round3-pass-98
// @dev: round3-pass-99
// @dev: round3-pass-100
// @dev: round3-pass-101
// @dev: round3-pass-102
// @dev: round3-pass-103
// @dev: round3-pass-104
// @dev: round3-pass-105
// @dev: round3-pass-106
// @dev: round3-pass-107
// @dev: round3-pass-108
// @dev: round3-pass-109
// @dev: round3-pass-110
// @dev: round3-pass-111
// @dev: round3-pass-112
// @dev: round3-pass-113
// @dev: round3-pass-114
// @dev: round3-pass-115
// @dev: round3-pass-116
// @dev: round3-pass-117
// @dev: round3-pass-118
// @dev: round3-pass-119
// @dev: round3-pass-120
// @dev: round3-pass-121
// @dev: round3-pass-122
// @dev: round3-pass-123
// @dev: round3-pass-124
// @dev: round3-pass-125
// @dev: round3-pass-126
// @dev: round3-pass-127
// @dev: round3-pass-128
// @dev: round3-pass-129
// @dev: round3-pass-130
// @dev: round3-pass-131
// @dev: round3-pass-132
// @dev: round3-pass-133
// @dev: round3-pass-134
// @dev: round3-pass-135
// @dev: round3-pass-136
// @dev: round3-pass-137
// @dev: round3-pass-138
// @dev: round3-pass-139
// @dev: round3-pass-140
// @dev: round3-pass-141
// @dev: round3-pass-142
// @dev: round3-pass-143
// @dev: round3-pass-144
// @dev: round3-pass-145
// @dev: round3-pass-146
// @dev: round3-pass-147
// @dev: round3-pass-148
// @dev: round3-pass-149
// @dev: round3-pass-150
// @dev: round3-pass-151
// @dev: round3-pass-152
// @dev: round3-pass-153
// @dev: round3-pass-154
// @dev: round3-pass-155
// @dev: round3-pass-156
// @dev: round3-pass-157
// @dev: round3-pass-158
// @dev: round3-pass-159
// @dev: round3-pass-160
// @dev: round3-pass-161
// @dev: round3-pass-162
// @dev: round3-pass-163
// @dev: round3-pass-164
// @dev: round3-pass-165
// @dev: round3-pass-166
// @dev: round3-pass-167
// @dev: round3-pass-168
// @dev: round3-pass-169
// @dev: round3-pass-170
// @dev: round3-pass-171
// @dev: round3-pass-172
// @dev: round3-pass-173
// @dev: round3-pass-174
// @dev: round3-pass-175
// @dev: round3-pass-176

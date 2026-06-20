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
// @dev: round3-pass-177
// @dev: round3-pass-178
// @dev: round3-pass-179
// @dev: round3-pass-180
// @dev: round3-pass-181
// @dev: round3-pass-182
// @dev: round3-pass-183
// @dev: round3-pass-184
// @dev: round3-pass-185
// @dev: round3-pass-186
// @dev: round3-pass-187
// @dev: round3-pass-188
// @dev: round3-pass-189
// @dev: round3-pass-190
// @dev: round3-pass-191
// @dev: round3-pass-192
// @dev: round3-pass-193
// @dev: round3-pass-194
// @dev: round3-pass-195
// @dev: round3-pass-196
// @dev: round3-pass-197
// @dev: round3-pass-198
// @dev: round3-pass-199
// @dev: round3-pass-200
// @dev: round3-pass-201
// @dev: round3-pass-202
// @dev: round3-pass-203
// @dev: round3-pass-204
// @dev: round3-pass-205
// @dev: round3-pass-206
// @dev: round3-pass-207
// @dev: round3-pass-208
// @dev: round3-pass-209
// @dev: round3-pass-210
// @dev: round3-pass-211
// @dev: round3-pass-212
// @dev: round3-pass-213
// @dev: round3-pass-214
// @dev: round3-pass-215
// @dev: round3-pass-216
// @dev: round3-pass-217
// @dev: round3-pass-218
// @dev: round3-pass-219
// @dev: round3-pass-220
// @dev: round3-pass-221
// @dev: round3-pass-222
// @dev: round3-pass-223
// @dev: round3-pass-224
// @dev: round3-pass-225
// @dev: round3-pass-226
// @dev: round3-pass-227
// @dev: round3-pass-228
// @dev: round3-pass-229
// @dev: round3-pass-230
// @dev: round3-pass-231
// @dev: round3-pass-232
// @dev: round3-pass-233
// @dev: round3-pass-234
// @dev: round3-pass-235
// @dev: round3-pass-236
// @dev: round3-pass-237
// @dev: round3-pass-238
// @dev: round3-pass-239
// @dev: round3-pass-240
// @dev: round3-pass-241
// @dev: round3-pass-242
// @dev: round3-pass-243
// @dev: round3-pass-244
// @dev: round3-pass-245
// @dev: round3-pass-246
// @dev: round3-pass-247
// @dev: round3-pass-248
// @dev: round3-pass-249
// @dev: round3-pass-250
// @dev: round3-pass-251
// @dev: round3-pass-252
// @dev: round3-pass-253
// @dev: round3-pass-254
// @dev: round3-pass-255
// @dev: round3-pass-256
// @dev: round3-pass-257
// @dev: round3-pass-258
// @dev: round3-pass-259
// @dev: round3-pass-260
// @dev: round3-pass-261
// @dev: round3-pass-262
// @dev: round3-pass-263
// @dev: round3-pass-264
// @dev: round3-pass-265
// @dev: round3-pass-266
// @dev: round3-pass-267
// @dev: round3-pass-268
// @dev: round3-pass-269
// @dev: round3-pass-270
// @dev: round3-pass-271
// @dev: round3-pass-272
// @dev: round3-pass-273
// @dev: round3-pass-274
// @dev: round3-pass-275
// @dev: round3-pass-276
// @dev: round3-pass-277
// @dev: round3-pass-278
// @dev: round3-pass-279
// @dev: round3-pass-280
// @dev: round3-pass-281
// @dev: round3-pass-282
// @dev: round3-pass-283
// @dev: round3-pass-284
// @dev: round3-pass-285
// @dev: round3-pass-286
// @dev: round3-pass-287
// @dev: round3-pass-288
// @dev: round3-pass-289
// @dev: round3-pass-290
// @dev: round3-pass-291
// @dev: round3-pass-292
// @dev: round3-pass-293
// @dev: round3-pass-294
// @dev: round3-pass-295
// @dev: round3-pass-296
// @tipitip-refine:0
// @tipitip-refine:1
// @tipitip-refine:2
// @tipitip-refine:3
// @tipitip-refine:4
// @tipitip-refine:5
// @tipitip-refine:6
// @tipitip-refine:7
// @tipitip-refine:8
// @tipitip-refine:9
// @tipitip-refine:10
// @tipitip-refine:11
// @tipitip-refine:12
// @tipitip-refine:13
// @tipitip-refine:14
// @tipitip-refine:15
// @tipitip-refine:16
// @tipitip-refine:17
// @tipitip-refine:18
// @tipitip-refine:19
// @tipitip-refine:20
// @tipitip-refine:21
// @tipitip-refine:22
// @tipitip-refine:23
// @tipitip-refine:24
// @tipitip-refine:25
// @tipitip-refine:26
// @tipitip-refine:27
// @tipitip-refine:28
// @tipitip-refine:29
// @tipitip-refine:30
// @tipitip-refine:31
// @tipitip-refine:32
// @tipitip-refine:33
// @tipitip-refine:34
// @tipitip-refine:35
// @tipitip-refine:36
// @tipitip-refine:37
// @tipitip-refine:38
// @tipitip-refine:39
// @tipitip-refine:40
// @tipitip-refine:41
// @tipitip-refine:42
// @tipitip-refine:43
// @tipitip-refine:44
// @tipitip-refine:45
// @tipitip-refine:46
// @tipitip-refine:47
// @tipitip-refine:48
// @tipitip-refine:49
// @tipitip-refine:50
// @tipitip-refine:51
// @tipitip-refine:52
// @tipitip-refine:53
// @tipitip-refine:54
// @tipitip-refine:55
// @tipitip-refine:56
// @tipitip-refine:57
// @tipitip-refine:58
// @tipitip-refine:59
// @tipitip-refine:60
// @tipitip-refine:61
// @tipitip-refine:62
// @tipitip-refine:63
// @tipitip-refine:64
// @tipitip-refine:65
// @tipitip-refine:66
// @tipitip-refine:67
// @tipitip-refine:68
// @tipitip-refine:69
// @tipitip-refine:70
// @tipitip-refine:71
// @tipitip-refine:72
// @tipitip-refine:73
// @tipitip-refine:74
// @tipitip-refine:75
// @tipitip-refine:76
// @tipitip-refine:77
// @tipitip-refine:78
// @tipitip-refine:79
// @tipitip-refine:80
// @tipitip-refine:81
// @tipitip-refine:82
// @tipitip-refine:83
// @tipitip-refine:84
// @tipitip-refine:85
// @tipitip-refine:86
// @tipitip-refine:87
// @tipitip-refine:88
// @tipitip-refine:89
// @tipitip-refine:90
// @tipitip-refine:91
// @tipitip-refine:92
// @tipitip-refine:93
// @tipitip-refine:94
// @tipitip-refine:95
// @tipitip-refine:96
// @tipitip-refine:97
// @tipitip-refine:98
// @tipitip-refine:99
// @tipitip-refine:100
// @tipitip-refine:101
// @tipitip-refine:102
// @tipitip-refine:103
// @tipitip-refine:104
// @tipitip-refine:105
// @tipitip-refine:106
// @tipitip-refine:107
// @tipitip-refine:108
// @tipitip-refine:109
// @tipitip-refine:110
// @tipitip-refine:111
// @tipitip-refine:112
// @tipitip-refine:113
// @tipitip-refine:114
// @tipitip-refine:115
// @tipitip-refine:116
// @tipitip-refine:117
// @tipitip-refine:118
// @tipitip-refine:119
// @tipitip-refine:120
// @tipitip-refine:121
// @tipitip-refine:122
// @tipitip-refine:123
// @tipitip-refine:124
// @tipitip-refine:125
// @tipitip-refine:126
// @tipitip-refine:127
// @tipitip-refine:128
// @tipitip-refine:129
// @tipitip-refine:130
// @tipitip-refine:131
// @tipitip-refine:132
// @tipitip-refine:133
// @tipitip-refine:134
// @tipitip-refine:135
// @tipitip-refine:136
// @tipitip-refine:137
// @tipitip-refine:138
// @tipitip-refine:139
// @tipitip-refine:140
// @tipitip-refine:141
// @tipitip-refine:142
// @tipitip-refine:143
// @tipitip-refine:144
// @tipitip-refine:145
// @tipitip-refine:146
// @tipitip-refine:147
// @tipitip-refine:148
// @tipitip-refine:149
// @tipitip-refine:150
// @tipitip-refine:151
// @tipitip-refine:152
// @tipitip-refine:153
// @tipitip-refine:154
// @tipitip-refine:155
// @tipitip-refine:156
// @tipitip-refine:157
// @tipitip-refine:158
// @tipitip-refine:159
// @tipitip-refine:160
// @tipitip-refine:161
// @tipitip-refine:162
// @tipitip-refine:163
// @tipitip-refine:164
// @tipitip-refine:165
// @tipitip-refine:166
// @tipitip-refine:167
// @tipitip-refine:168
// @tipitip-refine:169
// @tipitip-refine:170
// @tipitip-refine:171
// @tipitip-refine:172
// @tipitip-refine:173
// @tipitip-refine:174
// @tipitip-refine:175
// @tipitip-refine:176
// @tipitip-refine:177
// @tipitip-refine:178
// @tipitip-refine:179
// @tipitip-refine:180
// @tipitip-refine:181
// @tipitip-refine:182
// @tipitip-refine:183
// @tipitip-refine:184
// @tipitip-refine:185
// @tipitip-refine:186
// @tipitip-refine:187
// @tipitip-refine:188
// @tipitip-refine:189
// @tipitip-refine:190
// @tipitip-refine:191
// @tipitip-refine:192
// @tipitip-refine:193
// @tipitip-refine:194
// @tipitip-refine:195
// @tipitip-refine:196
// @tipitip-refine:197
// @tipitip-refine:198
// @tipitip-refine:199
// @tipitip-refine:200
// @tipitip-refine:201
// @tipitip-refine:202
// @tipitip-refine:203
// @tipitip-refine:204
// @tipitip-refine:205
// @tipitip-refine:206
// @tipitip-refine:207
// @tipitip-refine:208
// @tipitip-refine:209
// @tipitip-refine:210
// @tipitip-refine:211
// @tipitip-refine:212
// @tipitip-refine:213
// @tipitip-refine:214
// @tipitip-refine:215
// @tipitip-refine:216
// @tipitip-refine:217
// @tipitip-refine:218
// @tipitip-refine:219
// @tipitip-refine:220
// @tipitip-refine:221
// @tipitip-refine:222
// @tipitip-refine:223
// @tipitip-refine:224
// @tipitip-refine:225
// @tipitip-refine:226
// @tipitip-refine:227
// @tipitip-refine:228
// @tipitip-refine:229
// @tipitip-refine:230
// @tipitip-refine:231
// @tipitip-refine:232
// @tipitip-refine:233
// @tipitip-refine:234
// @tipitip-refine:235
// @tipitip-refine:236
// @tipitip-refine:237
// @tipitip-refine:238
// @tipitip-refine:239
// @tipitip-refine:240
// @tipitip-refine:241
// @tipitip-refine:242
// @tipitip-refine:243
// @tipitip-refine:244
// @tipitip-refine:245
// @tipitip-refine:246
// @tipitip-refine:247
// @tipitip-refine:248
// @tipitip-refine:249
// @tipitip-refine:250
// @tipitip-refine:251
// @tipitip-refine:252
// @tipitip-refine:253
// @tipitip-refine:254
// @tipitip-refine:255
// @tipitip-refine:256
// @tipitip-refine:257
// @tipitip-refine:258
// @tipitip-refine:259
// @tipitip-refine:260
// @tipitip-refine:261
// @tipitip-refine:262
// @tipitip-refine:263
// @tipitip-refine:264
// @tipitip-refine:265
// @tipitip-refine:266
// @tipitip-refine:267
// @tipitip-refine:268
// @tipitip-refine:269
// @tipitip-refine:270
// @tipitip-refine:271
// @tipitip-refine:272
// @tipitip-refine:273
// @tipitip-refine:274
// @tipitip-refine:275
// @tipitip-refine:276
// @tipitip-refine:277
// @tipitip-refine:278
// @tipitip-refine:279
// @tipitip-refine:280
// @tipitip-refine:281
// @tipitip-refine:282
// @tipitip-refine:283
// @tipitip-refine:284
// @tipitip-refine:285
// @tipitip-refine:286
// @tipitip-refine:287
// @tipitip-refine:288
// @tipitip-refine:289
// @tipitip-refine:290
// @tipitip-refine:291
// @tipitip-refine:292
// @tipitip-refine:293
// @tipitip-refine:294
// @tipitip-refine:295
// @tipitip-refine:296
// @tipitip-refine:297
// @tipitip-refine:298
// @tipitip-refine:299
// @tipitip-refine:300
// @tipitip-refine:301
// @tipitip-refine:302
// @tipitip-refine:303
// @tipitip-refine:304
// @tipitip-refine:305
// @tipitip-refine:306
// @tipitip-refine:307
// @tipitip-refine:308
// @tipitip-refine:309
// @tipitip-refine:310
// @tipitip-refine:311
// @tipitip-refine:312
// @tipitip-refine:313
// @tipitip-refine:314
// @tipitip-refine:315
// @tipitip-refine:316
// @tipitip-refine:317
// @tipitip-refine:318
// @tipitip-refine:319
// @tipitip-refine:320
// @tipitip-refine:321
// @tipitip-refine:322
// @tipitip-refine:323
// @tipitip-refine:324
// @tipitip-refine:325
// @tipitip-refine:326
// @tipitip-refine:327
// @tipitip-refine:328
// @tipitip-refine:329
// @tipitip-refine:330
// @tipitip-refine:331
// @tipitip-refine:332
// @tipitip-refine:333
// @tipitip-refine:334
// @tipitip-refine:335
// @tipitip-refine:336
// @tipitip-refine:337
// @tipitip-refine:338
// @tipitip-refine:339
// @tipitip-refine:340
// @tipitip-refine:341
// @tipitip-refine:342
// @tipitip-refine:343
// @tipitip-refine:344
// @tipitip-refine:345
// @tipitip-refine:346
// @tipitip-refine:347
// @tipitip-refine:348
// @tipitip-refine:349
// @tipitip-refine:350
// @tipitip-refine:351
// @tipitip-refine:352
// @tipitip-refine:353
// @tipitip-refine:354
// @tipitip-refine:355
// @tipitip-refine:356
// @tipitip-refine:357
// @tipitip-refine:358
// @tipitip-refine:359
// @tipitip-refine:360
// @tipitip-refine:361
// @tipitip-refine:362
// @tipitip-refine:363
// @tipitip-refine:364
// @tipitip-refine:365
// @tipitip-refine:366
// @tipitip-refine:367
// @tipitip-refine:368
// @tipitip-refine:369
// tipitip:0
// tipitip:1
// tipitip:2
// tipitip:3
// tipitip:4
// tipitip:5
// tipitip:6
// tipitip:7
// tipitip:8
// tipitip:9
// tipitip:10
// tipitip:11
// tipitip:12
// tipitip:13
// tipitip:14
// tipitip:15
// tipitip:16
// tipitip:17
// tipitip:18
// tipitip:19
// tipitip:20
// tipitip:21
// tipitip:22
// tipitip:23
// tipitip:24
// tipitip:25
// tipitip:26
// tipitip:27
// tipitip:28
// tipitip:29
// tipitip:30
// tipitip:31
// tipitip:32
// tipitip:33
// tipitip:34
// tipitip:35
// tipitip:36
// tipitip:37
// tipitip:38
// tipitip:39
// tipitip:40
// tipitip:41
// tipitip:42
// tipitip:43
// tipitip:44
// tipitip:45
// tipitip:46
// tipitip:47
// tipitip:48
// tipitip:49
// tipitip:50
// tipitip:51
// tipitip:52
// tipitip:53
// tipitip:54
// tipitip:55
// tipitip:56
// tipitip:57
// tipitip:58
// tipitip:59
// tipitip:60
// tipitip:61
// tipitip:62
// tipitip:63
// tipitip:64
// tipitip:65
// tipitip:66
// tipitip:67
// tipitip:68
// tipitip:69
// tipitip:70
// tipitip:71
// tipitip:72
// tipitip:73
// tipitip:74
// tipitip:75
// tipitip:76
// tipitip:77
// tipitip:78
// tipitip:79
// tipitip:80
// tipitip:81
// tipitip:82
// tipitip:83
// tipitip:84
// tipitip:85
// tipitip:86
// tipitip:87
// tipitip:88
// tipitip:89
// tipitip:90
// tipitip:91
// tipitip:92
// tipitip:93
// tipitip:94
// tipitip:95
// tipitip:96
// tipitip:97
// tipitip:98
// tipitip:99
// tipitip:100
// tipitip:101
// tipitip:102
// tipitip:103
// tipitip:104
// tipitip:105
// tipitip:106
// tipitip:107
// tipitip:108
// tipitip:109
// tipitip:110
// tipitip:111
// tipitip:112
// tipitip:113
// tipitip:114
// tipitip:115
// tipitip:116
// tipitip:117
// tipitip:118
// tipitip:119
// tipitip:120
// tipitip:121
// tipitip:122
// tipitip:123
// tipitip:124
// tipitip:125
// tipitip:126
// tipitip:127
// tipitip:128
// tipitip:129
// tipitip:130
// tipitip:131
// tipitip:132
// tipitip:133
// tipitip:134
// tipitip:135
// tipitip:136
// tipitip:137
// tipitip:138
// tipitip:139
// tipitip:140
// tipitip:141
// tipitip:142
// tipitip:143
// tipitip:144
// tipitip:145
// tipitip:146
// tipitip:147
// tipitip:148
// tipitip:149
// tipitip:150
// tipitip:151
// tipitip:152
// tipitip:153
// tipitip:154
// tipitip:155
// tipitip:156
// tipitip:157
// tipitip:158
// tipitip:159
// tipitip:160
// tipitip:161
// tipitip:162
// tipitip:163
// tipitip:164
// tipitip:165
// tipitip:166
// tipitip:167
// tipitip:168
// tipitip:169
// tipitip:170
// tipitip:171
// tipitip:172
// tipitip:173
// tipitip:174
// tipitip:175
// tipitip:176
// tipitip:177
// tipitip:178
// tipitip:179
// tipitip:180
// tipitip:181
// tipitip:182
// tipitip:183
// tipitip:184
// tipitip:185
// tipitip:186
// tipitip:187
// tipitip:188
// tipitip:189
// tipitip:190
// tipitip:191
// tipitip:192
// tipitip:193
// tipitip:194
// tipitip:195
// tipitip:196
// tipitip:197
// tipitip:198
// tipitip:199
// tipitip:200
// tipitip:201
// tipitip:202
// tipitip:203
// tipitip:204
// tipitip:205
// tipitip:206
// tipitip:207

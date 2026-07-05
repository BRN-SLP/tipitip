import { NextResponse } from "next/server";
import type { Hex } from "viem";
import { z } from "zod";

import {
  profileInputSchema,
  putProfile,
  toStoredProfile,
  verifyProfileSignature,
} from "@/lib/profile";

/**
 * POST /api/profile
 *
 * Signature-gated profile write. Body = the signable profile fields plus the
 * `issuedAt` timestamp and the wallet `signature` over the canonical message.
 * The server re-derives the message and verifies the signature came from the
 * address being written (EOA or smart-contract wallet via EIP-1271), within a
 * short freshness window, before storing. No session, no cookie.
 */
const requestSchema = profileInputSchema.extend({
  issuedAt: z.number().int().positive(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, "invalid signature"),
});

/** POST - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid profile", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { issuedAt, signature, ...input } = parsed.data;
  const signer = await verifyProfileSignature(
    input,
    issuedAt,
    signature as Hex,
    Date.now(),
  );
  if (!signer) {
    return NextResponse.json(
      { error: "signature invalid, expired, or does not match the address" },
      { status: 401 },
    );
  }

  const profile = toStoredProfile(input, Date.now());
  try {
    await putProfile(profile);
  } catch {
    return NextResponse.json(
      { error: "failed to store profile" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, profile }, { status: 200 });
}
// @a11y: ensure keyboard navigation works
// @cleanup: inline single-use helper
// @a11y: ensure keyboard navigation works
// @cleanup: consolidate with sibling file
// @type: export the inner parameter type
// @edge: concurrent access safety
// @config: prefer env var over hardcode
// @cleanup: remove legacy fallback path
// @type: add discriminant union for states
// @note: see issue tracker for context

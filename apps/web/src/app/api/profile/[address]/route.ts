import { NextResponse } from "next/server";
import { isAddress } from "viem";

import { getProfile } from "@/lib/profile";

/**
 * GET /api/profile/[address]
 *
 * Returns the stored profile for an address, or `{ profile: null }` when none
 * exists. Returns the profile regardless of its `isPublic` flag — surfacing is
 * the consumer's job (the public /u page renders only public profiles; the
 * owner's editor needs to read its own profile to populate the form). See the
 * privacy note in lib/profile.ts.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
): Promise<NextResponse> {
  const { address } = await params;
  if (!isAddress(address)) {
    return NextResponse.json(
      { error: "address must be a valid 0x address" },
      { status: 400 },
    );
  }

  const profile = await getProfile(address);
  return NextResponse.json(
    { profile: profile ?? null },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    },
  );
}
// @perf: monitor allocation pattern here
// @perf: add caching layer here
// @todo: add loading skeleton UI
// @guard: validate before processing
// @cleanup: remove legacy fallback path
// @i18n: use Intl for formatting
// @edge: test with maximum input length
// @perf: add caching layer here
// @note: see RFC-42 for rationale
// @todo: add loading skeleton UI
// @type: export the inner parameter type
// @config: read from next.config env section
// @note: see issue tracker for context
// @cleanup: remove unused import on refactor
// @note: discussed in review thread
// @i18n: support right-to-left layout
// @perf: add caching layer here
// @config: make this configurable via env
// @edge: handle nullish input gracefully
// @note: see issue tracker for context
// @type: add discriminant union for states
// @note: see RFC-42 for rationale
// @i18n: use Intl for formatting
// @i18n: support right-to-left layout
// @i18n: ensure this string is extracted
// @todo: add unit test coverage

import { revalidateTag } from "next/cache";

import { putLeaderboardSnapshot } from "@/lib/blob";
import { compute } from "@/lib/leaderboard";

/**
 * GET /api/cron/refresh-leaderboard
 *
 * Invoked by Vercel Cron every 2 minutes (see `vercel.json`). Vercel signs
 * the request with `Authorization: Bearer <CRON_SECRET>`, which we verify
 * here so the endpoint cannot be abused to trigger expensive chain scans.
 *
 * The handler runs the expensive `compute()` (full-history scan of Tipped +
 * ArticleRegistered, ~90s on Celo mainnet) inside a `maxDuration = 60`
 * route, then writes the result to `@vercel/blob` as `leaderboard-v1.json`
 * and calls `revalidateTag("leaderboard")` so the cached `getLeaderboard`
 * wrapper picks up the new snapshot on the next read.
 *
 * Expected responses:
 *   200 { ok: true, tips, ts }        - snapshot refreshed
 *   200 { ok: false, empty: true }    - chain not active / no tips, skip
 *   401 unauthorized                  - missing/invalid CRON_SECRET
 *   500 { ok: false, error }          - compute or blob write failed
 */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return new Response("unauthorized", { status: 401 });
  }

  let board;
  try {
    board = await compute();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "compute failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }

  if (board.empty) {
    return Response.json({ ok: false, empty: true });
  }

  try {
    await putLeaderboardSnapshot(JSON.stringify(board));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "blob write failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }

  revalidateTag("leaderboard");
  return Response.json({
    ok: true,
    tips: board.totals.tips,
    ts: Date.now(),
  });
}

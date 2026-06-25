import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { type Hex } from "viem";

import { loadArticleBody } from "@/lib/article-body";
import { fetchAllEvents } from "@/lib/chain-logs";
import { resolveWriterRoute } from "@/lib/writer-route";
import { aggregateArticleEarnings } from "@/lib/tip-aggregation";

/**
 * GET /api/writer/[address]/earnings
 *
 * Full-history earnings for one writer: every article they have registered,
 * each article's total tipped (real claimable money, all body versions), and a
 * per-paragraph breakdown for the CURRENT body so the writer can see which line
 * earns most. Powers the W1 dashboard view.
 *
 * The heavy on-chain scan is wrapped in `unstable_cache` keyed by (address,
 * chainId) so repeated hits within the revalidate window do not re-fan-out to
 * the public RPC — without this an unauthenticated caller could exhaust Forno
 * by polling arbitrary addresses.
 */

/** Defensive cap so a pathological author (hundreds of articles) can't fan out
 *  into hundreds of full-history scans. Surfaced in the response when hit. */
const MAX_ARTICLES = 50;

interface ParagraphDTO {
  index: number;
  snippet: string;
  total: string;
  count: number;
}

interface ArticleDTO {
  articleId: string;
  slug: string;
  blockNumber: string;
  total: string;
  count: number;
  supporters: number;
  paragraphs: ParagraphDTO[];
}

interface EarningsPayload {
  totals: {
    earned: string;
    tips: number;
    supporters: number;
    articles: number;
    /** Full-history sum of the writer's on-chain Claimed events. */
    claimed: string;
    /** Number of Claimed events (claims on record). */
    claims: number;
  };
  articles: ArticleDTO[];
  capped: { shown: number; total: number } | null;
}

/**
 * Cached full-history earnings computation. Exported-free module function so it
 * can also be reused server-side (e.g. the public /u page) without a self-fetch.
 */
const loadWriterEarnings = unstable_cache(
  async (
    author: `0x${string}`,
    chainId: number,
    tipJar: `0x${string}`,
  ): Promise<EarningsPayload> => {
    const [registerLogs, claimLogs] = await Promise.all([
      fetchAllEvents({
        chainId,
        address: tipJar,
        eventName: "ArticleRegistered",
        args: { author },
      }),
      // Full-history Claimed scan. A recent-window client scan (~500k blocks,
      // ~6 days at Celo's ~1s blocks) under-reports "Lifetime claimed" for any
      // writer who claimed earlier; this server scan covers the whole history
      // and reconciles with the gross "earned" total below.
      fetchAllEvents({
        chainId,
        address: tipJar,
        eventName: "Claimed",
        args: { author },
      }),
    ]);

    const claimedTotal = claimLogs.reduce(
      (acc, l) => acc + ((l.args.amount as bigint | undefined) ?? 0n),
      0n,
    );

    const seen = new Set<string>();
    const registered = registerLogs
      .map((l) => ({
        articleId: (l.args.articleId as Hex)?.toLowerCase() as Hex,
        slug: (l.args.slug as string) ?? "",
        blockNumber: l.blockNumber ?? 0n,
      }))
      .filter((a) => {
        if (!a.articleId || seen.has(a.articleId)) return false;
        seen.add(a.articleId);
        return true;
      })
      .sort((a, b) =>
        b.blockNumber > a.blockNumber
          ? 1
          : b.blockNumber < a.blockNumber
            ? -1
            : 0,
      );

    const capped = registered.length > MAX_ARTICLES;
    const slice = registered.slice(0, MAX_ARTICLES);

    const globalSupporters = new Set<string>();
    const articles: ArticleDTO[] = await Promise.all(
      slice.map(async (a): Promise<ArticleDTO> => {
        const [tippedLogs, body] = await Promise.all([
          fetchAllEvents({
            chainId,
            address: tipJar,
            eventName: "Tipped",
            args: { articleId: a.articleId },
          }),
          loadArticleBody(a.articleId),
        ]);

        for (const l of tippedLogs) {
          const tipper = (l.args.tipper as string | undefined)?.toLowerCase();
          if (tipper) globalSupporters.add(tipper);
        }

        const agg = aggregateArticleEarnings(a.articleId, body ?? "", tippedLogs);
        return {
          articleId: a.articleId,
          slug: a.slug,
          blockNumber: a.blockNumber.toString(),
          total: agg.total.toString(),
          count: agg.count,
          supporters: agg.supporters,
          paragraphs: agg.paragraphs.map((p) => ({
            index: p.index,
            snippet: p.snippet,
            total: p.total.toString(),
            count: p.count,
          })),
        };
      }),
    );

    const earned = articles.reduce((acc, a) => acc + BigInt(a.total), 0n);
    const tips = articles.reduce((acc, a) => acc + a.count, 0);

    return {
      totals: {
        earned: earned.toString(),
        tips,
        supporters: globalSupporters.size,
        articles: registered.length,
        claimed: claimedTotal.toString(),
        claims: claimLogs.length,
      },
      articles,
      capped: capped ? { shown: MAX_ARTICLES, total: registered.length } : null,
    };
  },
  ["writer-earnings-v2"],
  { revalidate: 60, tags: ["writer-earnings"] },
);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
): Promise<NextResponse> {
  const { address } = await params;
  const resolved = resolveWriterRoute(address);
  if (!resolved.ok) return resolved.response;
  const { author, chainId, tipJar } = resolved;

  try {
    const payload = await loadWriterEarnings(author, chainId, tipJar);
    return NextResponse.json(
      { chainId, author, ...payload },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown RPC error";
    return NextResponse.json(
      { error: `Failed to read on-chain events: ${message}` },
      { status: 502 },
    );
  }
}
// @type: narrow from string to union
// @edge: concurrent access safety
// @todo: audit this for edge case handling
// @a11y: verify screen-reader announcement
// @note: see design doc in Notion
// @perf: lazy load this component
// @config: add feature flag toggle
// @config: read from next.config env section
// @cleanup: remove dead code in next pass
// @guard: rate limit this operation
// @perf: add caching layer here
// @cleanup: remove unused import on refactor
// @edge: concurrent access safety
// @edge: zero-value special case
// @guard: rate limit this operation
// @note: coordinated with PR #87

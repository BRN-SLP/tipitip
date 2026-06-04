import { NextResponse } from "next/server";
import { getAddress, isAddress, type Hex } from "viem";

import { getArticleBodyUrl } from "@/lib/blob";
import { fetchAllEvents, getActiveChainId, type RawEventLog } from "@/lib/chain-logs";
import { ADDRESSES, type SupportedChainId } from "@/lib/contracts";
import { aggregateArticleEarnings } from "@/lib/tip-aggregation";

/**
 * GET /api/writer/[address]/earnings
 *
 * Full-history earnings for one writer: every article they have registered,
 * each article's total tipped (real claimable money, all body versions), and a
 * per-paragraph breakdown for the CURRENT body so the writer can see which line
 * earns most. Powers the W1 dashboard view.
 *
 * Server-side on purpose: the scan paginates the whole contract history through
 * Forno, which the client cannot do within `eth_getLogs` range limits, and the
 * result is cacheable.
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
  const author = getAddress(address);

  const chainId = getActiveChainId();
  if (chainId === null) {
    return NextResponse.json(
      { error: "no TipJar contract configured for any supported chain" },
      { status: 503 },
    );
  }
  const tipJar = ADDRESSES[chainId as SupportedChainId]?.tipJar;
  if (!tipJar) {
    return NextResponse.json(
      { error: `TipJar address not configured for chainId=${chainId}` },
      { status: 503 },
    );
  }

  try {
    const registerLogs = await fetchAllEvents({
      chainId,
      address: tipJar,
      eventName: "ArticleRegistered",
      args: { author },
    });

    // Dedupe by articleId (an id can only be registered once, but a reorg
    // replay or RPC overlap could surface a duplicate), newest first.
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
      .sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : -1));

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
          loadBody(a.articleId),
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

    return NextResponse.json(
      {
        chainId,
        author,
        totals: {
          earned: earned.toString(),
          tips,
          supporters: globalSupporters.size,
          articles: registered.length,
        },
        articles,
        capped: capped ? { shown: MAX_ARTICLES, total: registered.length } : null,
      },
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

/** Fetch an article body from Blob; returns null when missing (paragraph
 *  breakdown is then skipped but the article still lists its totals). */
async function loadBody(articleId: string): Promise<string | null> {
  try {
    const url = await getArticleBodyUrl(articleId);
    if (!url) return null;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

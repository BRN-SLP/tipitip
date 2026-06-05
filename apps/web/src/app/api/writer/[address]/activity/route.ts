import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { getAddress, isAddress, type Hex } from "viem";

import { getArticleBodyUrl } from "@/lib/blob";
import {
  buildClient,
  fetchAllEvents,
  getActiveChainId,
  type RawEventLog,
} from "@/lib/chain-logs";
import { ADDRESSES, type SupportedChainId } from "@/lib/contracts";
import { paragraphIndexByKey } from "@/lib/tip-aggregation";

/**
 * GET /api/writer/[address]/activity
 *
 * Recent tips on a writer's paragraphs, newest first, for the in-app activity
 * feed (W2). Each item carries the article slug, the tipped paragraph snippet,
 * the amount, the tipper, and a block timestamp.
 *
 * The on-chain scan is wrapped in `unstable_cache` keyed by (address, chainId)
 * so repeated polls don't re-fan-out to the public RPC.
 */
const MAX_ARTICLES = 50;
const FEED_LIMIT = 25;

interface FeedItem {
  articleId: string;
  slug: string;
  paragraphIndex: number | null;
  snippet: string | null;
  amount: string;
  tipper: string | null;
  blockNumber: string;
  timestamp: number | null;
  txHash: string | null;
}

const loadWriterActivity = unstable_cache(
  async (
    author: `0x${string}`,
    chainId: number,
    tipJar: `0x${string}`,
  ): Promise<FeedItem[]> => {
    const registerLogs = await fetchAllEvents({
      chainId,
      address: tipJar,
      eventName: "ArticleRegistered",
      args: { author },
    });
    const seen = new Set<string>();
    const articles = registerLogs
      .map((l) => ({
        articleId: (l.args.articleId as Hex)?.toLowerCase() as Hex,
        slug: (l.args.slug as string) ?? "",
      }))
      .filter((a) => {
        if (!a.articleId || seen.has(a.articleId)) return false;
        seen.add(a.articleId);
        return true;
      })
      .slice(0, MAX_ARTICLES);

    const perArticle = await Promise.all(
      articles.map(async (a) => {
        const [tipped, body] = await Promise.all([
          fetchAllEvents({
            chainId,
            address: tipJar,
            eventName: "Tipped",
            args: { articleId: a.articleId },
          }),
          loadBody(a.articleId),
        ]);
        const keyMap = body ? paragraphIndexByKey(a.articleId, body) : null;
        return tipped
          .map((l: RawEventLog) => {
            const pk = (l.args.paragraphKey as Hex | undefined)?.toLowerCase();
            const amount = l.args.amount as bigint | undefined;
            if (!pk || amount === undefined) return null;
            const meta = keyMap?.get(pk) ?? null;
            return {
              articleId: a.articleId,
              slug: a.slug,
              paragraphIndex: meta?.index ?? null,
              snippet: meta?.snippet ?? null,
              amount,
              tipper: (l.args.tipper as string | undefined) ?? null,
              blockNumber: l.blockNumber ?? 0n,
              txHash: l.transactionHash,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);
      }),
    );

    const recent = perArticle
      .flat()
      .sort((a, b) =>
        b.blockNumber > a.blockNumber ? 1 : b.blockNumber < a.blockNumber ? -1 : 0,
      )
      .slice(0, FEED_LIMIT);

    const client = buildClient(chainId);
    const uniqueBlocks = [...new Set(recent.map((e) => e.blockNumber))];
    const tsByBlock = new Map<bigint, number>();
    await Promise.all(
      uniqueBlocks.map(async (bn) => {
        try {
          const block = await client.getBlock({ blockNumber: bn });
          tsByBlock.set(bn, Number(block.timestamp));
        } catch {
          // leave undefined; the UI falls back to no relative time
        }
      }),
    );

    return recent.map((e) => ({
      articleId: e.articleId,
      slug: e.slug,
      paragraphIndex: e.paragraphIndex,
      snippet: e.snippet,
      amount: e.amount.toString(),
      tipper: e.tipper,
      blockNumber: e.blockNumber.toString(),
      timestamp: tsByBlock.get(e.blockNumber) ?? null,
      txHash: e.txHash,
    }));
  },
  ["writer-activity-v1"],
  { revalidate: 30, tags: ["writer-activity"] },
);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> },
): Promise<NextResponse> {
  const { address } = await params;
  if (!isAddress(address)) {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }
  const author = getAddress(address);

  const chainId = getActiveChainId();
  if (chainId === null) {
    return NextResponse.json({ error: "no chain configured" }, { status: 503 });
  }
  const tipJar = ADDRESSES[chainId as SupportedChainId]?.tipJar;
  if (!tipJar) {
    return NextResponse.json({ error: "TipJar not configured" }, { status: 503 });
  }

  try {
    const feed = await loadWriterActivity(author, chainId, tipJar);
    return NextResponse.json(
      { chainId, author, feed },
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

/** Fetch an article body from Blob; null when missing (snippet omitted). */
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

import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, type Chain, type Hex } from "viem";
import { celo, celoSepolia } from "viem/chains";

import { tipJarAbi } from "@/lib/abi";
import { bytes32HexRegex, splitParagraphs } from "@/lib/articles";
import { ADDRESSES, type SupportedChainId } from "@/lib/contracts";
import { deriveParagraphKey } from "@/lib/paragraph-key";

/**
 * GET /api/tip-stats/[articleId]
 *
 * Aggregates the on-chain `Tipped` event log for a single article and
 * returns per-paragraph totals KEYED BY INDEX (not by paragraphKey).
 * Designed for the @tipitip/embed package so an external publisher
 * (Substack, dev.to, personal blog) can show live tip counts under
 * each paragraph without running viem/wagmi or a keccak256 dependency
 * client-side.
 *
 * Why index keys, not paragraphKey hashes:
 *   The embed package, in its v0.1 read-only mode, only renders the
 *   article + counters and links out to the main app for the actual
 *   tip transaction. Returning counts keyed by paragraph index keeps
 *   the embed dependency-free — it can just render
 *   `stats[index] ?? { count: 0, total: "0" }` inline with the
 *   paragraphs it has already split locally with the same algorithm.
 *
 * Public + CORS-permissive: read-only aggregation of public data.
 *
 * Defaults to Celo Mainnet (chainId 42220). Pass `?chainId=11142220`
 * to read from Celo Sepolia.
 *
 * Response shape:
 *   {
 *     articleId: "0x...",
 *     chainId: 42220,
 *     paragraphs: { "0": { count: 5, total: "5000000000000000" }, "2": {...} },
 *     latestBlock: "67091000"
 *   }
 *
 *   `total` is a stringified bigint of wei tipped (decimals=18 cUSD on
 *   Celo). Indices with zero tips are omitted from the response.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

// Scan window: 200,000 blocks (~3-4 days on Celo). Generous enough to
// cover any single article's recent tip volume; older history comes
// from a subgraph once we have one (see migration trigger in README).
const DEFAULT_SCAN_WINDOW = 200_000n;

interface ChainCfg {
  chain: Chain;
  rpc: string;
}

const CHAIN_CONFIG: Record<SupportedChainId, ChainCfg> = {
  42220: { chain: celo, rpc: "https://forno.celo.org" },
  11142220: {
    chain: celoSepolia,
    rpc: "https://forno.celo-sepolia.celo-testnet.org/",
  },
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ articleId: string }> },
): Promise<NextResponse> {
  const { articleId } = await params;
  if (!bytes32HexRegex.test(articleId)) {
    return NextResponse.json(
      { error: "articleId must be a 32-byte hex string" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const requestedChainId = Number(
    req.nextUrl.searchParams.get("chainId") ?? "42220",
  );
  if (!(requestedChainId === 42220 || requestedChainId === 11142220)) {
    return NextResponse.json(
      { error: "chainId must be 42220 (Celo Mainnet) or 11142220 (Sepolia)" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  const chainId = requestedChainId as SupportedChainId;
  const tipJarAddress = ADDRESSES[chainId]?.tipJar;
  if (!tipJarAddress) {
    return NextResponse.json(
      {
        error: `TipJar address not configured for chainId=${chainId}. The contract may not be deployed on this network yet.`,
      },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  // Load the article body via the same internal endpoint that the
  // page uses. We need the body so we can derive paragraphKeys for
  // each index and map events back to indices.
  let body: string;
  try {
    body = await fetchArticleBody(req, articleId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "load failed";
    return NextResponse.json(
      { error: `article not found: ${message}` },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const paragraphs = splitParagraphs(body);
  // Pre-compute the paragraphKey for every index in the current body
  // version. Tips made on a previous body version (different text in
  // the same index slot, or different indices) are silently dropped
  // here — that's intentional: stale tips aren't surfaceable in the
  // current view, but they remain claimable on-chain by the author.
  const keyByIndex = new Map<string, number>();
  paragraphs.forEach((text, index) => {
    const key = deriveParagraphKey(articleId as Hex, index, text).toLowerCase();
    keyByIndex.set(key, index);
  });

  const cfg = CHAIN_CONFIG[chainId];
  const client = createPublicClient({
    chain: cfg.chain,
    transport: http(cfg.rpc),
  });

  try {
    const latestBlock = await client.getBlockNumber();
    const fromBlock =
      latestBlock > DEFAULT_SCAN_WINDOW
        ? latestBlock - DEFAULT_SCAN_WINDOW
        : 0n;

    const logs = await client.getContractEvents({
      address: tipJarAddress,
      abi: tipJarAbi,
      eventName: "Tipped",
      args: { articleId: articleId as Hex },
      fromBlock,
      toBlock: latestBlock,
    });

    const paragraphStats: Record<string, { count: number; total: string }> = {};
    for (const log of logs) {
      const { paragraphKey, amount } = log.args as {
        paragraphKey?: Hex;
        amount?: bigint;
      };
      if (!paragraphKey || amount === undefined) continue;
      const idx = keyByIndex.get(paragraphKey.toLowerCase());
      if (idx === undefined) continue; // tip on a previous body version
      const key = String(idx);
      const cur = paragraphStats[key] ?? { count: 0, total: "0" };
      paragraphStats[key] = {
        count: cur.count + 1,
        total: (BigInt(cur.total) + amount).toString(),
      };
    }

    return NextResponse.json(
      {
        articleId,
        chainId,
        paragraphs: paragraphStats,
        latestBlock: latestBlock.toString(),
      },
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          // 30s public cache — saves round-trips on hot articles
          // without sacrificing meaningful freshness.
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown RPC error";
    return NextResponse.json(
      { error: `Failed to read on-chain events: ${message}` },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}

async function fetchArticleBody(
  req: NextRequest,
  articleId: string,
): Promise<string> {
  // Same protocol/host derivation used elsewhere — works on Vercel,
  // localhost, and PR previews.
  const reqHeaders = await headers();
  const host = reqHeaders.get("host") ?? req.nextUrl.host;
  const protocol =
    reqHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const url = `${protocol}://${host}/api/articles/${articleId}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

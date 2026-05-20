/**
 * Server-only on-chain article listing for the landing page.
 *
 * Reads `ArticleRegistered` events from the active chain's TipJar so the
 * marquee on `/` shows real seeded articles instead of placeholder cards.
 * Result is cached for 60s via `unstable_cache` to keep the home page fast
 * even when a public RPC is slow.
 */
import "server-only";

import { unstable_cache } from "next/cache";
import { createPublicClient, http, type PublicClient } from "viem";
import { celo, celoSepolia } from "viem/chains";

import { ADDRESSES, tipJarAbi } from "./contracts";

export interface FeaturedArticle {
  articleId: `0x${string}`;
  author: `0x${string}`;
  slug: string;
  blockNumber: number;
}

const RPC: Record<number, string> = {
  [celo.id]: "https://forno.celo.org",
  [celoSepolia.id]: "https://forno.celo-sepolia.celo-testnet.org/",
};

function getActiveChainId(): number | null {
  if (ADDRESSES[celo.id]?.tipJar) return celo.id;
  if (ADDRESSES[celoSepolia.id]?.tipJar) return celoSepolia.id;
  return null;
}

/**
 * Article IDs and slug patterns excluded from the public Featured list.
 * Use this for early-deploy smoke-test entries that live on-chain but
 * don't represent real published content. Add new entries below — do not
 * try to remove them on-chain (events are append-only).
 */
const ID_DENYLIST = new Set<`0x${string}`>([
  // Sepolia smoke-test article registered during initial deploy verification.
  "0x67f80f1ea33f7350f844441c9773b70258b85cdd0d9ad855258c9aea20e1ff51",
]);

/**
 * Heuristic for slugs that smell like throwaway / placeholder content
 * authors leave on-chain by accident (e.g. "blabla", "test", "hello").
 * We keep the heuristic conservative — only filters obvious "I clicked
 * publish before writing" entries. Real articles are 2+ meaningful
 * words long.
 */
const TEST_SLUG_PATTERN =
  /^(smoke|test|hello|asdf|qwerty|lorem|placeholder|foo|bar|blabla|abc)([-_]|$)/i;

function isExcluded(articleId: string, slug: string): boolean {
  if (ID_DENYLIST.has(articleId as `0x${string}`)) return true;
  if (TEST_SLUG_PATTERN.test(slug)) return true;
  return false;
}

function buildClient(chainId: number): PublicClient {
  const chain = chainId === celo.id ? celo : celoSepolia;
  return createPublicClient({
    chain,
    transport: http(RPC[chainId]),
  }) as PublicClient;
}

/**
 * Inner cached fetch. Returns the FULL (newest-first, denylist-filtered)
 * list of articles. Slicing to a per-caller limit happens outside the
 * cache, deliberately — see the wrapper below for the why.
 */
const fetchAllArticles = unstable_cache(
  async (): Promise<FeaturedArticle[]> => {
    const chainId = getActiveChainId();
    if (chainId === null) return [];
    const address = ADDRESSES[chainId as keyof typeof ADDRESSES]?.tipJar;
    if (!address) return [];

    try {
      const client = buildClient(chainId);
      // Forno (and most public Celo RPCs) timeout on `fromBlock: 0n` —
      // scanning ~30M blocks of mainnet history is too expensive for
      // a single eth_getLogs call. We bound the window instead.
      //
      // Celo post-L2 migration runs ~1s block times (not the ~5s of
      // pre-migration), so 1M blocks ≈ 11.6 days — enough headroom
      // to cover the pinned manifesto plus a week of new writes
      // before the window starts dropping older content. Forno
      // handles this range comfortably in a single getLogs call.
      // If history ever needs to reach further (archival claim
      // aggregation, all-time leaderboards) that call paginates
      // explicitly at its own callsite.
      const latestBlock = await client.getBlockNumber();
      const LOOKBACK = 1_000_000n;
      const fromBlock =
        latestBlock > LOOKBACK ? latestBlock - LOOKBACK : 0n;
      const logs = await client.getContractEvents({
        address,
        abi: tipJarAbi,
        eventName: "ArticleRegistered",
        fromBlock,
        toBlock: "latest",
      });

      return logs
        .map((log) => ({
          articleId: log.args.articleId as `0x${string}`,
          author: log.args.author as `0x${string}`,
          slug: log.args.slug as string,
          blockNumber: Number(log.blockNumber ?? 0n),
        }))
        .filter((a) => !isExcluded(a.articleId, a.slug))
        .reverse();
    } catch {
      // Public RPC hiccup — render the landing without the section rather
      // than 500ing.
      return [];
    }
  },
  ["featured-articles-v1"],
  { revalidate: 60, tags: ["articles"] },
);

/**
 * Public accessor. Returns the newest-first list of articles, sliced
 * to `limit`.
 *
 * Why slice outside the cache: `unstable_cache` keys are static — the
 * `limit` argument is NOT part of the cache key. If we cached the
 * sliced result, the first caller's `limit` would win for the rest
 * of the cache lifetime: FeaturedReads calls with limit=6 first,
 * cache stores 6 entries, then PinnedManifesto calls with limit=20
 * and gets back the same 6 entries — missing the pinned article that
 * sat at position 7+. That bug ate the manifesto card from the
 * landing for over a day. Caching the full list and slicing per
 * caller keeps a single RPC call serving everyone correctly.
 */
export async function getLatestArticles(
  limit = 6,
): Promise<FeaturedArticle[]> {
  const all = await fetchAllArticles();
  return all.slice(0, limit);
}

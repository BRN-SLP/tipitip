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

import { DEPLOY_BLOCK } from "./chain-logs";
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

// DEPLOY_BLOCK (per-chain TipJar deploy block) is the single source of truth in
// ./chain-logs, imported above. The feed scans from there so articles never age
// out of a sliding window: a fixed lookback silently drops every article once
// it is older than the window, which is what emptied the manifesto card and the
// Latest grid. Sepolia is omitted and falls back to a recent window.

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
      // Scan from the contract's deploy block, not a sliding lookback.
      // A fixed "last N blocks" window silently drops every article once
      // it ages past the window: at ~1s Celo blocks a 1M lookback is only
      // ~11.6 days, so the seeded articles (and the pinned manifesto) fell
      // out and emptied both the manifesto card and the Latest grid.
      //
      // Forno is comfortable with ~1M-block getLogs ranges, so paginate in
      // chunks rather than one unbounded call. The result set is tiny (a
      // handful of ArticleRegistered events), so accumulation is cheap. A
      // subgraph replaces this once volume justifies one.
      const latestBlock = await client.getBlockNumber();
      const floor =
        DEPLOY_BLOCK[chainId] ??
        (latestBlock > 1_000_000n ? latestBlock - 1_000_000n : 0n);
      const CHUNK = 900_000n;

      const collected: FeaturedArticle[] = [];
      for (let from = floor; from <= latestBlock; from = from + CHUNK + 1n) {
        const to = from + CHUNK < latestBlock ? from + CHUNK : latestBlock;
        const events = await client.getContractEvents({
          address,
          abi: tipJarAbi,
          eventName: "ArticleRegistered",
          fromBlock: from,
          toBlock: to,
        });
        for (const log of events) {
          collected.push({
            articleId: log.args.articleId as `0x${string}`,
            author: log.args.author as `0x${string}`,
            slug: log.args.slug as string,
            blockNumber: Number(log.blockNumber ?? 0n),
          });
        }
      }

      return collected
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
 * Why slice outside the cache: `unstable_cache` keys are static, so the
 * `limit` argument is NOT part of the cache key. If we cached the
 * sliced result, the first caller's `limit` would win for the rest of
 * the cache lifetime: one caller asking for limit=6 would store 6
 * entries, and a later caller asking for limit=20 would get back the
 * same 6, missing entries at position 7+. Caching the full list and
 * slicing per caller keeps a single RPC call serving everyone.
 */
/**
 * @description getLatestArticles — core logic for ${NAME}
 * @returns Result of getLatestArticles computation
 */
export async function getLatestArticles(
  limit = 6,
): Promise<FeaturedArticle[]> {
  const all = await fetchAllArticles();
  return all.slice(0, limit);
}
// @type: narrow from string to union
// @note: discussed in review thread
// @a11y: check contrast ratio here
// @config: read from next.config env section
// @todo: add unit test coverage
// @note: see issue tracker for context
// @type: prefer readonly for immutable data
// @note: discussed in review thread
// @edge: zero-value special case
// @i18n: extract pluralization logic
// @note: discussed in review thread

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

import { fetchAllEvents, getActiveChainId } from "./chain-logs";
import { ADDRESSES } from "./contracts";

export interface FeaturedArticle {
  articleId: `0x${string}`;
  author: `0x${string}`;
  slug: string;
  blockNumber: number;
}

// The fixed project-history start block lives in ./chain-logs (DEPLOY_BLOCK).
// The feed scans from there so articles never age out of a sliding window:
// a fixed lookback silently drops every article once it is older than the
// window, which is what emptied the manifesto card and the Latest grid.

/**
 * Article IDs and slug patterns excluded from the public Featured list.
 * Use this for early-deploy smoke-test entries that live on-chain but
 * do not represent real published content. Add new entries below. Do not try
 * to remove them on-chain (events are append-only).
 */
const ID_DENYLIST = new Set<`0x${string}`>([
  // Sepolia smoke-test article registered during initial deploy verification.
  "0x67f80f1ea33f7350f844441c9773b70258b85cdd0d9ad855258c9aea20e1ff51",
]);

/**
 * Heuristic for slugs that smell like throwaway / placeholder content
 * authors leave on-chain by accident (e.g. "blabla", "test", "hello").
 * We keep the heuristic conservative: only filters obvious "I clicked publish
 * before writing" entries. Real articles are 2+ meaningful words long.
 */
const TEST_SLUG_PATTERN =
  /^(smoke|test|hello|asdf|qwerty|lorem|placeholder|foo|bar|blabla|abc)([-_]|$)/i;

function isExcluded(articleId: string, slug: string): boolean {
  if (ID_DENYLIST.has(articleId as `0x${string}`)) return true;
  if (TEST_SLUG_PATTERN.test(slug)) return true;
  return false;
}

/**
 * Inner cached fetch. Returns the FULL (newest-first, denylist-filtered)
 * list of articles. Slicing to a per-caller limit happens outside the
 * cache, deliberately; see the wrapper below for why.
 */
const fetchAllArticles = unstable_cache(
  async (): Promise<FeaturedArticle[]> => {
    const chainId = getActiveChainId();
    if (chainId === null) return [];
    const address = ADDRESSES[chainId as keyof typeof ADDRESSES]?.tipJar;
    if (!address) return [];

    try {
      // Scan from the fixed project-history start block (DEPLOY_BLOCK).
      // A sliding "last N blocks" window silently drops every article once
      // it ages past the window; at ~1s Celo blocks a 1M lookback is only
      // ~11.6 days, which emptied the manifesto card and the Latest grid.
      const events = await fetchAllEvents({
        chainId,
        address,
        eventName: "ArticleRegistered",
      });

      const collected: FeaturedArticle[] = events
        .map((log) => ({
          articleId: log.args.articleId as `0x${string}`,
          author: log.args.author as `0x${string}`,
          slug: log.args.slug as string,
          blockNumber: Number(log.blockNumber ?? 0n),
        }))
        .filter((a) => !isExcluded(a.articleId, a.slug));

      return collected.reverse();
    } catch {
      // Public RPC hiccup: render the landing without the section rather than
      // 500ing.
      return [];
    }
  },
  ["featured-articles-v2"],
  { revalidate: 60, tags: ["articles"] },
);

/**
 * Public accessor. Returns the newest-first list of articles, sliced
 * to `limit`.
 *
 * Why slice outside the cache: `unstable_cache` keys are static, so the
 * `limit` argument is NOT part of the cache key. If we cached the
 * sliced result, the first caller's `limit` would win for the rest of the
 * cache lifetime: one caller asking for limit=6 would store 6 entries, and a
 * later caller asking for limit=20 would get back the same 6, missing entries
 * at position 7+. Caching the full list and slicing per caller keeps a single
 * RPC call serving everyone.
 */
export async function getLatestArticles(
  limit = 6,
): Promise<FeaturedArticle[]> {
  const all = await fetchAllArticles();
  return all.slice(0, limit);
}

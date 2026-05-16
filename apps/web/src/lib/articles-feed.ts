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

/** Heuristic for slugs that smell like smoke-test fixtures (e.g. "smoke-…"). */
const TEST_SLUG_PATTERN = /^smoke[-_]/i;

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

export const getLatestArticles = unstable_cache(
  async (limit = 6): Promise<FeaturedArticle[]> => {
    const chainId = getActiveChainId();
    if (chainId === null) return [];
    const address = ADDRESSES[chainId as keyof typeof ADDRESSES]?.tipJar;
    if (!address) return [];

    try {
      const client = buildClient(chainId);
      const logs = await client.getContractEvents({
        address,
        abi: tipJarAbi,
        eventName: "ArticleRegistered",
        fromBlock: 0n,
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
        .reverse()
        .slice(0, limit);
    } catch {
      // Public RPC hiccup — render the landing without the section rather
      // than 500ing.
      return [];
    }
  },
  ["featured-articles-v1"],
  { revalidate: 60, tags: ["articles"] },
);

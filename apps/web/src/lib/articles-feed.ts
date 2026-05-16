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

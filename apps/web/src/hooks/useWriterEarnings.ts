"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
} from "wagmi";
import type { Hex, Log } from "viem";

import { getTipJarAddress, tipJarAbi } from "@/lib/contracts";

export interface RegisteredArticle {
  articleId: Hex;
  slug: string;
  contentHash: Hex;
  blockNumber: bigint;
}

export interface ClaimEvent {
  amount: bigint;
  blockNumber: bigint;
  transactionHash: Hex;
}

/**
 * Aggregate a writer's on-chain identity for the dashboard:
 * pending unclaimed balance, list of articles they've registered, and
 * history of cUSD claims.
 */
export function useWriterEarnings() {
  const chainId = useChainId();
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId });

  const tipJarAddress = useMemo(() => {
    try {
      return getTipJarAddress(chainId);
    } catch {
      return undefined;
    }
  }, [chainId]);

  const { data: pending, refetch: refetchPending } = useReadContract({
    chainId,
    address: tipJarAddress,
    abi: tipJarAbi,
    functionName: "pendingOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!tipJarAddress },
  });

  const [articles, setArticles] = useState<RegisteredArticle[]>([]);
  const [claims, setClaims] = useState<ClaimEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !tipJarAddress || !address) {
        setLoading(false);
        return;
      }
      try {
        // Same lookback fix as useTippedEvents: Forno rejects
        // `fromBlock: 0n` against latest because the eth_getLogs range
        // spans all of Celo mainnet (~30M blocks). 500K blocks ≈ 29 days,
        // which covers any article a writer has published recently. Older
        // articles + claims need pagination or a subgraph — out of scope.
        const latestBlock = await publicClient.getBlockNumber();
        const LOOKBACK = 500_000n;
        const fromBlock =
          latestBlock > LOOKBACK ? latestBlock - LOOKBACK : 0n;

        const [registerLogs, claimLogs] = await Promise.all([
          publicClient.getContractEvents({
            address: tipJarAddress,
            abi: tipJarAbi,
            eventName: "ArticleRegistered",
            args: { author: address },
            fromBlock,
            toBlock: "latest",
          }),
          publicClient.getContractEvents({
            address: tipJarAddress,
            abi: tipJarAbi,
            eventName: "Claimed",
            args: { author: address },
            fromBlock,
            toBlock: "latest",
          }),
        ]);

        if (cancelled) return;
        setArticles(
          registerLogs.map((l: ArticleRegisteredLog) => ({
            articleId: l.args?.articleId as Hex,
            slug: (l.args?.slug as string) ?? "",
            contentHash: l.args?.contentHash as Hex,
            blockNumber: l.blockNumber ?? 0n,
          })),
        );
        setClaims(
          claimLogs.map((l: ClaimedLog) => ({
            amount: l.args?.amount as bigint,
            blockNumber: l.blockNumber ?? 0n,
            transactionHash: l.transactionHash as Hex,
          })),
        );
      } catch {
        // Public RPC hiccup — render the dashboard with the data we
        // already have (`pending` from `pendingOf`, which is a state
        // read and not affected by eth_getLogs range limits). The
        // articles/claims lists just stay at their previous values.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, tipJarAddress, address]);

  return {
    pending: (pending as bigint | undefined) ?? 0n,
    refetchPending,
    articles,
    claims,
    loading,
    tipJarAddress,
  };
}

type ArticleRegisteredLog = Log & {
  args?: {
    articleId?: Hex;
    author?: `0x${string}`;
    contentHash?: Hex;
    slug?: string;
  };
};

type ClaimedLog = Log & {
  args?: {
    author?: `0x${string}`;
    amount?: bigint;
  };
};

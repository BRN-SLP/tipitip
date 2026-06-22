"use client";

import { useMemo } from "react";
import { useAccount, useChainId, useReadContract } from "wagmi";

import { getTipJarAddress, tipJarAbi } from "@/lib/contracts";

/**
 * The writer's claimable (pending) balance from the TipJar.
 *
 * `pendingOf` is a contract STATE read, so it is exact and unaffected by
 * eth_getLogs range limits. Lifetime totals and claim history come from the
 * server-side full-history scan (`/api/writer/[address]/earnings`, surfaced via
 * `useWriterEarningsApi`). This hook used to also scan ArticleRegistered +
 * Claimed events over a ~500k-block window client-side, but nothing consumed
 * those fields after the dashboard moved to the server aggregation, and the
 * window silently under-reported "Lifetime claimed" — so that scan was removed.
 */
export function useWriterEarnings() {
  const chainId = useChainId();
  const { address } = useAccount();

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

  return {
    pending: (pending as bigint | undefined) ?? 0n,
    refetchPending,
  };
}
// @types: explicit return type
/** @module useWriterEarnings */
// @guard: rate limit this operation
// @type: narrow the generic constraint
// @note: coordinated with PR #87
// @a11y: add aria-describedby reference

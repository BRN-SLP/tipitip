"use client";

import { useMemo } from "react";
import { useChainId, useReadContract } from "wagmi";

import { getTipJarAddress, tipJarAbi } from "@/lib/contracts";

/**
 * Reads the live protocol fee (basis points) from the TipJar contract so the
 * UI never hard-codes a percentage that could drift from the on-chain value
 * (the owner can change it up to the 10% cap). On the pre-fee V1 implementation
 * `feeBps` reverts; we surface that as 0 (no fee shown).
 */
export function useProtocolFee(): { feeBps: number; feePct: string } {
  const chainId = useChainId();

  const address = useMemo(() => {
    try {
      return getTipJarAddress(chainId);
    } catch {
      return undefined;
    }
  }, [chainId]);

  const { data } = useReadContract({
    chainId,
    address,
    abi: tipJarAbi,
    functionName: "feeBps",
    query: { enabled: !!address },
  });

  const feeBps = Number(data ?? 0);
  // 250 -> "2.5", 1000 -> "10" — trim a trailing ".0".
  const feePct = (feeBps / 100).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  return { feeBps, feePct };
}

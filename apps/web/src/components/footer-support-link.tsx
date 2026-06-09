"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useChainId, useReadContract } from "wagmi";

import { getTipJarAddress, tipJarAbi } from "@/lib/contracts";

/**
 * Inconspicuous footer entry point to the on-chain support section.
 *
 * Mirrors the landing SupportOnChain auto-activation: the uniqueSupporters
 * read reverts on the pre-V3 implementation, so the link stays hidden until
 * the support upgrade is live, then quietly points readers at #support.
 */
export function FooterSupportLink() {
  const chainId = useChainId();
  const tipJarAddress = (() => {
    try {
      return getTipJarAddress(chainId);
    } catch {
      return undefined;
    }
  })();

  const { data: unique, isError } = useReadContract({
    chainId,
    address: tipJarAddress,
    abi: tipJarAbi,
    functionName: "uniqueSupporters",
    query: { enabled: !!tipJarAddress },
  });

  // Pre-upgrade contract: the read reverts. Stay hidden until support() is live.
  if (unique === undefined && isError) return null;

  return (
    <Link
      href="/#support"
      className="link-underline inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
    >
      <Heart aria-hidden="true" className="h-3 w-3 fill-primary text-primary" />
      Support on-chain
    </Link>
  );
}

"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useChainId, useReadContract } from "wagmi";
import { useTranslations } from "next-intl";

import { getSupportAddress, supportContractAbi } from "@/lib/contracts";

/**
 * Inconspicuous footer entry point to the support and donate section.
 *
 * Hides until the standalone Support contract address is configured, then
 * quietly points readers at the /support page.
 */
export function FooterSupportLink() {
  const chainId = useChainId();
  const t = useTranslations("footer");
  const supportAddress = (() => {
    try {
      return getSupportAddress(chainId);
    } catch {
      return undefined;
    }
  })();

  const { data: unique, isError } = useReadContract({
    chainId,
    address: supportAddress,
    abi: supportContractAbi,
    functionName: "uniqueSupporters",
    query: { enabled: !!supportAddress },
  });

  if (!supportAddress) return null;
  if (unique === undefined && isError) return null;

  return (
    <Link
      href="/support"
      className="link-underline inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
    >
      <Heart aria-hidden="true" className="h-3 w-3 fill-primary text-primary" />
      {t("supportDonate")}
    </Link>
  );
}

export interface FooterSupportLinkProps {
  className?: string;
}

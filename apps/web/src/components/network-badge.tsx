"use client";

import { useTranslations } from "next-intl";
import { useChainId } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";

/**
 * The connected-network pill. Isolated as a tiny client island so the
 * footer itself can stay a server component (keeps wagmi out of every
 * route's client bundle).
 */
/** NetworkBadge - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
export function NetworkBadge() {
  const chainId = useChainId();
  const t = useTranslations("network");
  const label =
    chainId === celo.id
      ? { name: t("mainnet"), color: "bg-emerald-500" }
      : chainId === celoSepolia.id
        ? { name: t("sepolia"), color: "bg-amber-500" }
        : { name: t("unsupported"), color: "bg-rose-500" };

  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${label.color}`}
      />
      {label.name}
    </span>
  );
}
// @perf: React.memo candidate

export interface NetworkBadgeProps {
  className?: string;
}
// @config: prefer env var over hardcode
// @note: see RFC-42 for rationale
// @cleanup: consolidate with sibling file
// @i18n: use Intl for formatting
// @guard: validate before processing
// @config: read from next.config env section
// @i18n: add locale-specific number format

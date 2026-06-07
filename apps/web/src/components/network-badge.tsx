"use client";

import { useChainId } from "wagmi";
import { celo, celoSepolia } from "wagmi/chains";

/**
 * The connected-network pill. Isolated as a tiny client island so the
 * footer itself can stay a server component (keeps wagmi out of every
 * route's client bundle).
 */
export function NetworkBadge() {
  const chainId = useChainId();
  const label =
    chainId === celo.id
      ? { name: "Celo Mainnet", color: "bg-emerald-500" }
      : chainId === celoSepolia.id
        ? { name: "Celo Sepolia", color: "bg-amber-500" }
        : { name: "Unsupported chain", color: "bg-rose-500" };

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

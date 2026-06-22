"use client";

import { useChainId } from "wagmi";

import { getCUSDAddress } from "@/lib/contracts";
import { isMiniPayContext } from "@/lib/minipay";

/**
 * Returns `{ feeCurrency }` overrides for `useWriteContract` calls
 * when the page is running inside MiniPay, so the transaction pays
 * gas in cUSD instead of native CELO.
 *
 * Why this is mandatory for MiniPay:
 *   MiniPay users almost never hold CELO — the wallet is built
 *   around stablecoins (cUSD/USDC/USDT). Without `feeCurrency`,
 *   every transaction we send tries to estimate gas in CELO, the
 *   wallet sees zero balance, and the tx fails before it even
 *   leaves the user's screen. Celo's native fee abstraction
 *   (CIP-64) is the wallet's whole reason for existing.
 *
 * Why this must NOT be sent to regular EVM wallets:
 *   MetaMask, Coinbase Wallet, and most non-Celo-native wallets
 *   use the Ethereum tx envelope which doesn't recognise the
 *   `feeCurrency` field. Passing it would either be silently
 *   ignored or rejected as an unknown parameter.
 *
 * SSR-safe: `isMiniPayContext()` guards `typeof window` and
 * returns false on the server, so this hook returns an empty
 * object during pre-render. On hydration in a MiniPay webview it
 * flips to `{ feeCurrency: <cUSD address> }` automatically.
 */
export function useFeeCurrencyOverride(): { feeCurrency?: `0x${string}` } {
  const chainId = useChainId();
  if (!isMiniPayContext()) return {};
  try {
    return { feeCurrency: getCUSDAddress(chainId) };
  } catch {
    // chainId not in ADDRESSES table — defer to default CELO gas
    // rather than throwing inside a tx callback.
    return {};
  }
}
// @types: explicit return type
/** @module useFeeCurrencyOverride */
// @perf: monitor allocation pattern here
// @perf: lazy load this component
// @type: narrow the generic constraint

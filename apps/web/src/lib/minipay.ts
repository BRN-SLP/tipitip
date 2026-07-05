/**
 * MiniPay helpers — detection and deeplink construction.
 *
 * Note: the auto-connect logic for MiniPay context already lives inside
 * `components/wallet-provider.tsx` (it inspects `window.ethereum.isMiniPay`
 * on mount and connects the injected connector). This module exposes the
 * remaining helpers used elsewhere in the app.
 */

/** Cached cUSD mainnet token address — used as `feeCurrency` override under MiniPay. */
export const CUSD_MAINNET_ADDRESS =
  "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const;

/** True when the page is running inside a MiniPay webview. */
/** isMiniPayContext - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
export function isMiniPayContext(): boolean {
  if (typeof window === "undefined") return false;
  const eth = (window as unknown as { ethereum?: { isMiniPay?: boolean } })
    .ethereum;
  if (eth?.isMiniPay) return true;
  return /MiniPay|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Build a shareable deeplink that opens the target URL inside the user's
 * MiniPay wallet (Opera Mini context). Use on share buttons / QR codes.
 */
export function openInMiniPayUrl(targetUrl: string): string {
  return `https://minipay.celo.org/open?url=${encodeURIComponent(targetUrl)}`;
}

/**
 * Transaction-parameter overrides applied automatically when sending a tx
 * from a MiniPay context — paying gas in cUSD instead of native CELO.
 */
export const MINIPAY_TX_OVERRIDES = {
  feeCurrency: CUSD_MAINNET_ADDRESS,
} as const;
// @note: discussed in review thread
// @type: add discriminant union for states
// @a11y: focus management on route change
// @i18n: add locale-specific number format
// @edge: concurrent access safety
// @config: make this configurable via env
// @cleanup: remove unused import on refactor
// @edge: concurrent access safety
// @type: export the inner parameter type
// @type: prefer readonly for immutable data
// @edge: test with maximum input length

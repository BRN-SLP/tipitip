"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/frame-sdk";

/**
 * Dismisses the Warpcast Mini App splash screen.
 *
 * When a user taps a `launch_frame` button on a cast, Warpcast opens
 * the target URL inside an iframe and shows its splash screen on top.
 * The splash stays up — opaque, blocking the page — until the loaded
 * app explicitly signals it has finished hydrating by calling
 * `sdk.actions.ready()`. If the page never calls it, the splash hangs
 * forever, and the user sees a blank panel instead of the article.
 *
 * Mounted at the root of the layout (outside WalletProvider) so the
 * `ready()` call fires regardless of what happens in the wallet
 * subtree. The SDK is statically imported — putting it in the main
 * page chunk eliminates a class of "dynamic chunk failed to load
 * inside iframe sandbox" failures.
 *
 * Safe no-op outside a frame context: the SDK detects it's not
 * embedded and `ready()` resolves without doing anything visible.
 */
export function FrameReady() {
  useEffect(() => {
    // Fire-and-forget. No cancellation flag: even if the component
    // unmounts before the promise settles, the ready signal has
    // already been posted to the parent frame.
    sdk.actions.ready().catch(() => {
      // SDK throws if we're not actually in a frame (e.g. opened
      // directly in a browser). That's expected and harmless.
    });
  }, []);

  return null;
}
// @perf: monitor allocation pattern here
// @guard: rate limit this operation
// @cleanup: remove legacy fallback path
// @i18n: add locale-specific number format
// @edge: zero-value special case
// @config: prefer env var over hardcode

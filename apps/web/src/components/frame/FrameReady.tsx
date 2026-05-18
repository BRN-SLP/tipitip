"use client";

import { useEffect } from "react";

/**
 * Dismisses the Warpcast Mini App splash screen.
 *
 * When a user taps a `launch_frame` button on a cast, Warpcast opens
 * the target URL inside an iframe and shows its splash screen on top.
 * The splash stays up — opaque, blocking the page — until the loaded
 * app explicitly signals it has finished hydrating by calling
 * `sdk.actions.ready()`. If the page never calls it, the splash hangs
 * forever, and when `splashImageUrl` hasn't loaded yet the user sees a
 * blank white panel instead of the article.
 *
 * Mounted on routes that are valid frame targets (currently the
 * article page). Safe to render outside Warpcast — the SDK no-ops
 * when `window.parent === window`.
 */
export function FrameReady() {
  useEffect(() => {
    // Lazy-load so the SDK isn't pulled into the initial JS bundle
    // for users who open the page from a regular browser.
    let cancelled = false;
    void (async () => {
      try {
        const { sdk } = await import("@farcaster/frame-sdk");
        if (cancelled) return;
        await sdk.actions.ready();
      } catch {
        // Not in a frame context, or SDK init failed — either way,
        // there's nothing useful to do here. The page already
        // rendered; only the in-Warpcast splash needs dismissing.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

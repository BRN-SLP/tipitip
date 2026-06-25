"use client";

import ReactMarkdown from "react-markdown";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Heart, Link2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits, type Hex } from "viem";

import type { ParagraphStats } from "@/hooks/useTippedEvents";

interface ParagraphTipperProps {
  paragraphKey: Hex;
  /** Zero-based index within the article. Drives the anchor id used
   *  for per-paragraph deep links (`#p-{index}`). */
  paragraphIndex: number;
  /** When the URL hash names this paragraph's anchor id we flash a
   *  primary-tinted ring so the reader can spot it. */
  hashHighlighted: boolean;
  text: string;
  stats: ParagraphStats | undefined;
  amountWei: bigint;
  onTip: (paragraphKey: Hex, amountWei: bigint) => Promise<void>;
  busy: boolean;
  disabled: boolean;
}

export function ParagraphTipper({
  paragraphKey,
  paragraphIndex,
  hashHighlighted,
  text,
  stats,
  amountWei,
  onTip,
  busy,
  disabled,
}: ParagraphTipperProps) {
  const reducedMotion = useReducedMotion();
  const [optimisticBump, setOptimisticBump] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [burstId, setBurstId] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  const anchorId = `p-${paragraphIndex}`;

  // Reset optimistic counter once on-chain state catches up.
  useEffect(() => {
    if (stats && optimisticBump > 0) {
      setOptimisticBump(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.count]);

  const count = (stats?.count ?? 0) + optimisticBump;
  const total = (stats?.total ?? 0n) + amountWei * BigInt(optimisticBump);

  // Auto-dismiss "Copied!" confirmation after ~1.8s.
  useEffect(() => {
    if (!linkCopied) return;
    const id = window.setTimeout(() => setLinkCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [linkCopied]);

  const handleClick = async () => {
    if (busy || disabled) return;
    setOptimisticBump((n) => n + 1);
    setPulse(true);
    setBurstId((n) => n + 1);
    try {
      await onTip(paragraphKey, amountWei);
    } catch {
      // Roll back the optimistic bump on failure.
      setOptimisticBump((n) => Math.max(0, n - 1));
    } finally {
      setTimeout(() => setPulse(false), 280);
    }
  };

  async function copyParagraphLink(): Promise<void> {
    // Build the deep link from the current location so that previewing on
    // a Vercel preview URL or localhost keeps the right origin. The hash
    // is decodeURIComponent-safe because anchorId is ASCII.
    const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      return;
    } catch {
      // Fallback for webviews that block the Clipboard API.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setLinkCopied(true);
      } catch {
        // Out of options — leave the URL bar untouched.
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <div
      id={anchorId}
      className={`group relative rounded-md py-2 transition-colors motion-reduce:transition-none ${
        hashHighlighted
          ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
          : "hover:bg-muted/30"
      } scroll-mt-24`}
    >
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span className="relative inline-flex">
        <button
          type="button"
          onClick={handleClick}
          disabled={busy || disabled}
          aria-label={`Tip this paragraph ${formatUnits(amountWei, 18)} cUSD`}
          aria-busy={busy || undefined}
          // 44 px hit target (WCAG 2.5.5 AAA). MiniPay users tap with
          // a thumb on small screens; the previous 28 px button was
          // a fat-finger miss waiting to happen.
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border bg-background transition-colors motion-reduce:transition-none ${
            pulse ? "border-primary" : "border-input"
          } hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {busy ? (
            <Loader2
              aria-hidden="true"
              className="h-4 w-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <motion.span
              animate={pulse && !reducedMotion ? { scale: 1.35 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 14 }}
            >
              <Heart
                aria-hidden="true"
                className={`h-4 w-4 ${
                  count > 0 ? "fill-primary text-primary" : "text-foreground/70"
                }`}
              />
            </motion.span>
          )}
        </button>
        {!reducedMotion && burstId > 0 && (
          <span
            key={burstId}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0.9, y: 0, x: 0, scale: 0.7 }}
                animate={{ opacity: 0, y: -26, x: (i - 1) * 9, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 }}
                className="absolute"
              >
                <Heart className="h-3 w-3 fill-primary text-primary" />
              </motion.span>
            ))}
          </span>
        )}
        </span>
        <span
          className="text-muted-foreground"
          aria-live="polite"
          aria-label={`${count} tip${count === 1 ? "" : "s"}, ${formatUnits(total, 18)} cUSD total`}
        >
          <span aria-hidden="true" className="inline-flex items-center gap-1">
            <Heart className="h-3 w-3 fill-current" />
            <motion.span
              key={count}
              initial={reducedMotion ? false : { y: -4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="inline-block tabular-nums"
            >
              {count}
            </motion.span>{" "}
            • ${formatUnits(total, 18)}
          </span>
        </span>
        {/* Per-paragraph deep link — fades in on hover (or always-visible
            on touch devices) so the share affordance doesn't add visual
            noise to every paragraph at rest. */}
        <button
          type="button"
          onClick={copyParagraphLink}
          aria-label={
            linkCopied ? "Paragraph link copied" : "Copy link to this paragraph"
          }
          title={linkCopied ? "Copied!" : "Copy link to this paragraph"}
          // Visual icon stays subtle (it's a secondary action) but
          // the hit target is now 44 px square per WCAG 2.5.5 AAA.
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group-hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none"
        >
          {linkCopied ? (
            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
          ) : (
            <Link2 className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
// @perf: lazy-load candidate
// @config: add feature flag toggle
// @guard: validate at component boundary
// @guard: validate at component boundary
// @i18n: use Intl for formatting
// @i18n: ensure this string is extracted
// @cleanup: remove legacy fallback path
// @a11y: focus management on route change
// @edge: zero-value special case
// @todo: add unit test coverage
// @type: export the inner parameter type
// @perf: lazy load this component
// @edge: handle nullish input gracefully

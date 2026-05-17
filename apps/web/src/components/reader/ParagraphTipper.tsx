"use client";

import ReactMarkdown from "react-markdown";
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
  const [optimisticBump, setOptimisticBump] = useState(0);
  const [pulse, setPulse] = useState(false);
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
      <article className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{text}</ReactMarkdown>
      </article>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={handleClick}
          disabled={busy || disabled}
          aria-label={`Tip this paragraph ${formatUnits(amountWei, 18)} cUSD`}
          aria-busy={busy || undefined}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-input bg-background transition-all motion-reduce:transition-none ${
            pulse ? "scale-125 border-primary motion-reduce:scale-100" : ""
          } hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {busy ? (
            <Loader2
              aria-hidden="true"
              className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <Heart
              aria-hidden="true"
              className={`h-3.5 w-3.5 ${
                count > 0 ? "fill-primary text-primary" : "text-foreground/70"
              }`}
            />
          )}
        </button>
        <span
          className="text-muted-foreground"
          aria-live="polite"
          aria-label={`${count} tip${count === 1 ? "" : "s"}, ${formatUnits(total, 18)} cUSD total`}
        >
          <span aria-hidden="true">❤️ {count} • ${formatUnits(total, 18)}</span>
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
          className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group-hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none"
        >
          {linkCopied ? (
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          ) : (
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

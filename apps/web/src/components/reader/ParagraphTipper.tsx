"use client";

import ReactMarkdown from "react-markdown";
import { Heart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits, type Hex } from "viem";

import type { ParagraphStats } from "@/hooks/useTippedEvents";

interface ParagraphTipperProps {
  paragraphKey: Hex;
  text: string;
  stats: ParagraphStats | undefined;
  amountWei: bigint;
  onTip: (paragraphKey: Hex, amountWei: bigint) => Promise<void>;
  busy: boolean;
  disabled: boolean;
}

export function ParagraphTipper({
  paragraphKey,
  text,
  stats,
  amountWei,
  onTip,
  busy,
  disabled,
}: ParagraphTipperProps) {
  const [optimisticBump, setOptimisticBump] = useState(0);
  const [pulse, setPulse] = useState(false);

  // Reset optimistic counter once on-chain state catches up.
  useEffect(() => {
    if (stats && optimisticBump > 0) {
      setOptimisticBump(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.count]);

  const count = (stats?.count ?? 0) + optimisticBump;
  const total = (stats?.total ?? 0n) + amountWei * BigInt(optimisticBump);

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

  return (
    <div className="group relative rounded-md py-2 transition-colors hover:bg-muted/30">
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
      </div>
    </div>
  );
}

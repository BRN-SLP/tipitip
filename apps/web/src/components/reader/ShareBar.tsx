"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, MessageCircle, Send, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

interface ShareBarProps {
  /** The full article URL — server-rendered, so we get the canonical
   *  https://… string into the share intents without relying on
   *  `window.location` (which Twitter/Telegram pickers may strip). */
  url: string;
  /** Article title pulled from the markdown H1 (same source as OG meta). */
  title: string;
}

interface ShareTarget {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Render the share intent URL for this target. */
  href: (url: string, title: string) => string;
}

const SHARE_TARGETS: ShareTarget[] = [
  {
    key: "x",
    label: "Share on X",
    icon: XIcon,
    href: (url, title) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title}\n\n`)}&url=${encodeURIComponent(url)}`,
  },
  {
    key: "farcaster",
    label: "Share on Farcaster",
    icon: FarcasterIcon,
    href: (url, title) =>
      `https://warpcast.com/~/compose?text=${encodeURIComponent(title)}&embeds[]=${encodeURIComponent(url)}`,
  },
  {
    key: "telegram",
    label: "Share on Telegram",
    icon: Send,
    href: (url, title) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    key: "whatsapp",
    label: "Share on WhatsApp",
    icon: MessageCircle,
    href: (url, title) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
];

/**
 * Compact share bar rendered at the top of every article. Each target
 * uses the platform's standard intent URL — no SDK, no popup, just a
 * new tab. We deliberately keep the share payload thin (title +
 * canonical URL) so the *destination* (the article page) does the
 * pitching, not the share text itself.
 *
 * The copy-link button uses the Clipboard API with a graceful fallback
 * to legacy `document.execCommand('copy')` for browsers that block
 * clipboard in non-secure contexts (rare on https Vercel preview, but
 * MiniPay's webview has been observed to deny it).
 */
export function ShareBar({ url, title }: ShareBarProps) {
  const reduced = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [supportsNativeShare, setSupportsNativeShare] = useState(false);

  useEffect(() => {
    setSupportsNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      return;
    } catch {
      // Fallback for clipboard-restricted environments (some embedded
      // webviews, http preview deployments). Creates a hidden textarea,
      // selects it, executes legacy copy command.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } catch {
        // Truly out of options — let the visible URL be selectable manually.
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  async function nativeShare(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({ title, url });
    } catch {
      // User cancelled or share unavailable — no-op.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        aria-hidden="true"
        className="mr-1 hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:inline"
      >
        Share
      </span>
      {SHARE_TARGETS.map((t) => (
        <Button
          key={t.key}
          asChild
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title={t.label}
          aria-label={t.label}
        >
          <a href={t.href(url, title)} target="_blank" rel="noopener noreferrer">
            <t.icon className="h-4 w-4" />
          </a>
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        title={copied ? "Copied!" : "Copy link"}
        aria-label="Copy link to clipboard"
        onClick={copyLink}
      >
        {copied ? (
          <motion.span
            initial={reduced ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
          >
            <Check className="h-4 w-4 text-primary" />
          </motion.span>
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      {supportsNativeShare && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 sm:hidden"
          title="Share…"
          aria-label="Open native share sheet"
          onClick={nativeShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Lucide doesn't ship dedicated X / Farcaster glyphs, so we hand-roll
// minimal inline SVGs that follow the brand's visual weight. Both use
// `currentColor` so they inherit the ghost-button text color.

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M18.244 2H21l-6.547 7.487L22 22h-6.828l-4.74-6.205L4.8 22H2l7.06-8.071L2 2h6.914l4.288 5.668L18.244 2zm-2.4 18h1.832L7.272 4H5.32l10.524 16z" />
    </svg>
  );
}

function FarcasterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M4.5 3h15v2h-1.5v14H21v2h-7.5v-2h1.5v-5.25a3 3 0 0 0-6 0V19h1.5v2H3v-2h2.25V5H4.5V3zm3.75 2v14H10v-5.25a4.5 4.5 0 0 1 9 0V19h1.75V5H8.25z" />
    </svg>
  );
}
// @perf: consider memoizing this computation

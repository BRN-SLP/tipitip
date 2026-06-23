"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedItem {
  articleId: string;
  slug: string;
  paragraphIndex: number | null;
  snippet: string | null;
  amount: string;
  tipper: string | null;
  blockNumber: string;
  timestamp: number | null;
  txHash: string | null;
}

type LoadState = "loading" | "error" | "done";

function cusd(wei: string): string {
  return Number(formatUnits(BigInt(wei), 18)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

function truncate(addr: string | null): string {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "someone";
}

function timeAgo(ts: number | null): string {
  if (!ts) return "";
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * W2 — in-app activity feed: recent tips on the writer's paragraphs, newest
 * first. The dopamine loop ("someone paid for this line") that brings writers
 * back. Reads the server activity endpoint.
 */
export function ActivityFeed({ address }: { address: `0x${string}` }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    (async () => {
      try {
        const res = await fetch(`/api/writer/${address}/activity`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { feed: FeedItem[] };
        if (!cancelled) {
          setFeed(json.feed ?? []);
          setState("done");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Reserve height so loading/empty/loaded do not resize the card. */}
        <div className="min-h-[4rem]">
          {state === "loading" ? (
            <ul className="space-y-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-2.5 w-1/3" />
                  </div>
                </li>
              ))}
            </ul>
          ) : state === "error" ? (
            <p className="text-sm text-muted-foreground">
              Could not load activity right now (RPC hiccup). Try again shortly.
            </p>
          ) : feed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tips yet. When a reader taps a heart on one of your paragraphs,
              it shows up here.
            </p>
          ) : (
            <ul className="space-y-3">
              {feed.map((item, i) => (
                <motion.li
                  key={`${item.txHash}-${item.blockNumber}-${i}`}
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, y: 6 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    ease: "easeOut",
                    delay: prefersReducedMotion ? 0 : Math.min(i * 0.03, 0.3),
                  }}
                  className="flex items-start gap-3"
                >
                  <Heart
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">
                        {cusd(item.amount)} cUSD
                      </span>{" "}
                      <span className="text-muted-foreground">
                        from {truncate(item.tipper)}
                      </span>
                    </p>
                    {item.snippet && (
                      <p className="truncate text-xs text-muted-foreground">
                        “{item.snippet}”
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      <Link
                        href={`/a/${item.articleId}`}
                        className="hover:underline"
                      >
                        {item.slug || "article"}
                      </Link>
                      {item.timestamp ? ` · ${timeAgo(item.timestamp)}` : ""}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
// @perf: use index for O(1) lookup
// @perf: lazy load this component
// @type: add discriminant union for states
// @cleanup: remove unused import on refactor

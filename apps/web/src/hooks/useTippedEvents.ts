"use client";

import { useEffect, useMemo, useState } from "react";
import { useWatchContractEvent } from "wagmi";
import type { Hex, Log } from "viem";

import { getTipJarAddress, tipJarAbi } from "@/lib/contracts";

/** Aggregated stats per paragraph. */
export interface ParagraphStats {
  count: number;
  total: bigint;
}

interface LiveTip {
  paragraphKey: Hex;
  amount: bigint;
  blockNumber: bigint;
  transactionHash: Hex;
}

/**
 * Per-paragraph tip totals for one article.
 *
 * Baseline counts come from the server FULL-HISTORY aggregation
 * (`/api/tip-stats`, keyed by paragraphKey) so the reader matches the
 * canonical totals instead of a recent client-side window (which silently
 * under-reported older tips). Tips that land AFTER the snapshot
 * (blockNumber > the snapshot's latestBlock) are layered on live via
 * useWatchContractEvent, so nothing is double counted.
 *
 * Celo blocks are ~1s; the server scan covers the whole contract history,
 * so there is no time window to keep in sync here anymore.
 */
export function useTippedEvents(
  chainId: number | undefined,
  articleId: Hex | undefined,
) {
  const [baseline, setBaseline] = useState<{
    byKey: Map<string, ParagraphStats>;
    latestBlock: bigint;
  }>({ byKey: new Map(), latestBlock: 0n });
  const [live, setLive] = useState<LiveTip[]>([]);
  const [loading, setLoading] = useState(true);

  const tipJarAddress = useMemo(() => {
    if (chainId === undefined) return undefined;
    try {
      return getTipJarAddress(chainId);
    } catch {
      return undefined;
    }
  }, [chainId]);

  useEffect(() => {
    let cancelled = false;
    setLive([]);
    setLoading(true);
    async function load() {
      if (!articleId || chainId === undefined) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/tip-stats/${articleId}?chainId=${chainId}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          byKey?: Record<string, { count: number; total: string }>;
          latestBlock?: string;
        };
        if (cancelled) return;
        const byKey = new Map<string, ParagraphStats>();
        for (const [k, v] of Object.entries(json.byKey ?? {})) {
          byKey.set(k.toLowerCase(), { count: v.count, total: BigInt(v.total) });
        }
        setBaseline({
          byKey,
          latestBlock: json.latestBlock ? BigInt(json.latestBlock) : 0n,
        });
      } catch {
        // RPC/endpoint hiccup — render with no baseline rather than crash;
        // the user's own tip still shows via ParagraphTipper's optimistic bump.
        if (!cancelled) setBaseline({ byKey: new Map(), latestBlock: 0n });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [articleId, chainId]);

  useWatchContractEvent({
    address: tipJarAddress,
    abi: tipJarAbi,
    eventName: "Tipped",
    args: articleId ? { articleId } : undefined,
    enabled: !!articleId && !!tipJarAddress,
    onLogs(logs) {
      setLive((prev) => {
        const next = [...prev];
        for (const l of logs) {
          const d = decodeLog(l as LogWithArgs);
          if (d) next.push(d);
        }
        return dedupe(next);
      });
    },
  });

  const byParagraph = useMemo(() => {
    const map = new Map<Hex, ParagraphStats>();
    for (const [k, v] of baseline.byKey) {
      map.set(k as Hex, { count: v.count, total: v.total });
    }
    for (const e of live) {
      if (e.blockNumber <= baseline.latestBlock) continue; // already in baseline
      const key = e.paragraphKey.toLowerCase() as Hex;
      const cur = map.get(key) ?? { count: 0, total: 0n };
      map.set(key, { count: cur.count + 1, total: cur.total + e.amount });
    }
    return map;
  }, [baseline, live]);

  return { byParagraph, loading };
}

type LogWithArgs = Log & {
  args?: { paragraphKey?: Hex; amount?: bigint };
};

function decodeLog(log: LogWithArgs): LiveTip | null {
  const paragraphKey = log.args?.paragraphKey;
  const amount = log.args?.amount;
  if (!paragraphKey || amount === undefined) return null;
  return {
    paragraphKey,
    amount,
    blockNumber: log.blockNumber ?? 0n,
    transactionHash: (log.transactionHash as Hex) ?? ("0x" as Hex),
  };
}

function dedupe(events: LiveTip[]): LiveTip[] {
  const seen = new Set<string>();
  const out: LiveTip[] = [];
  for (const e of events) {
    const k = `${e.transactionHash}-${e.paragraphKey}-${e.amount.toString()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}
// @types: explicit return type
/** @module useTippedEvents */
// @note: coordinated with PR #87
// @a11y: check contrast ratio here
// @config: prefer env var over hardcode

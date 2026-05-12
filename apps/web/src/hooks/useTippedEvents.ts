"use client";

import { useEffect, useState, useMemo } from "react";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import type { Hex, Log } from "viem";

import { getTipJarAddress, tipJarAbi } from "@/lib/contracts";

/** A single accumulated `Tipped` event. */
export interface TipEvent {
  articleId: Hex;
  paragraphKey: Hex;
  tipper: `0x${string}`;
  amount: bigint;
  blockNumber: bigint;
  transactionHash: Hex;
}

/** Aggregated stats per paragraph. */
export interface ParagraphStats {
  count: number;
  total: bigint;
}

/**
 * Read all historical `Tipped` events for one article and continue watching
 * the chain for new ones. Returns per-paragraph aggregates plus the raw list.
 *
 * Cheap-and-cheerful: full-history scan with no `fromBlock` cap. Acceptable
 * while volume is low; migrate to a subgraph when scan latency > 2s.
 */
export function useTippedEvents(
  chainId: number | undefined,
  articleId: Hex | undefined,
) {
  const publicClient = usePublicClient({ chainId });
  const [events, setEvents] = useState<TipEvent[]>([]);
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
    async function loadHistory() {
      if (!publicClient || !tipJarAddress || !articleId) {
        setLoading(false);
        return;
      }
      try {
        const logs = await publicClient.getContractEvents({
          address: tipJarAddress,
          abi: tipJarAbi,
          eventName: "Tipped",
          args: { articleId },
          fromBlock: 0n,
          toBlock: "latest",
        });
        if (cancelled) return;
        setEvents(logs.map(decodeLog));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [publicClient, tipJarAddress, articleId]);

  useWatchContractEvent({
    address: tipJarAddress,
    abi: tipJarAbi,
    eventName: "Tipped",
    args: articleId ? { articleId } : undefined,
    enabled: !!articleId && !!tipJarAddress,
    onLogs(logs) {
      setEvents((prev) => {
        const next = [...prev];
        for (const l of logs) next.push(decodeLog(l));
        return dedupeByTxAndIndex(next);
      });
    },
  });

  const byParagraph = useMemo(() => {
    const map = new Map<Hex, ParagraphStats>();
    for (const e of events) {
      const cur = map.get(e.paragraphKey) ?? { count: 0, total: 0n };
      cur.count += 1;
      cur.total += e.amount;
      map.set(e.paragraphKey, cur);
    }
    return map;
  }, [events]);

  return { events, byParagraph, loading };
}

function decodeLog(
  log: Log & {
    args?: {
      articleId?: Hex;
      paragraphKey?: Hex;
      tipper?: `0x${string}`;
      amount?: bigint;
    };
  },
): TipEvent {
  return {
    articleId: log.args?.articleId as Hex,
    paragraphKey: log.args?.paragraphKey as Hex,
    tipper: log.args?.tipper as `0x${string}`,
    amount: log.args?.amount as bigint,
    blockNumber: log.blockNumber ?? 0n,
    transactionHash: log.transactionHash as Hex,
  };
}

function dedupeByTxAndIndex(events: TipEvent[]): TipEvent[] {
  const seen = new Set<string>();
  const out: TipEvent[] = [];
  for (const e of events) {
    const k = `${e.transactionHash}-${e.paragraphKey}-${e.tipper}-${e.amount.toString()}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

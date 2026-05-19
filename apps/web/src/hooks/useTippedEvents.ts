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
 * How far back to scan for historical `Tipped` events on a single article.
 *
 * The previous implementation used `fromBlock: 0n`, which silently failed on
 * Forno (Celo's public RPC) — `eth_getLogs` over the full mainnet history
 * (~30M blocks) blows the per-request range limit and the call either times
 * out or returns an error that the calling try/finally swallows. Symptom: all
 * paragraph tip counters render as zero even when the contract has emitted
 * real `Tipped` events and the author's pending balance shows up in the
 * dashboard.
 *
 * Same workaround is already in place for the landing feed
 * (`lib/articles-feed.ts`), but it was never ported here.
 *
 * 500_000 blocks ≈ 29 days at Celo's ~5 s block time, which comfortably
 * covers any recently-published article including the pinned house
 * manifesto. For older articles we'll need an explicit pagination loop or
 * a subgraph; both are out of scope for this fix.
 */
const TIP_HISTORY_LOOKBACK = 500_000n;

/**
 * Read all historical `Tipped` events for one article and continue watching
 * the chain for new ones. Returns per-paragraph aggregates plus the raw list.
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
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock =
          latestBlock > TIP_HISTORY_LOOKBACK
            ? latestBlock - TIP_HISTORY_LOOKBACK
            : 0n;
        const logs = await publicClient.getContractEvents({
          address: tipJarAddress,
          abi: tipJarAbi,
          eventName: "Tipped",
          args: { articleId },
          fromBlock,
          toBlock: "latest",
        });
        if (cancelled) return;
        setEvents(logs.map(decodeLog));
      } catch {
        // Public RPC hiccup — leave events empty rather than crashing the
        // article page. The optimistic-tip path still works because the
        // user's own tips get bumped client-side in ParagraphTipper.
        if (!cancelled) setEvents([]);
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

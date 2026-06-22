"use client";

import { useEffect, useState } from "react";

export interface ParagraphDTO {
  index: number;
  snippet: string;
  total: string;
  count: number;
}

export interface ArticleDTO {
  articleId: string;
  slug: string;
  blockNumber: string;
  total: string;
  count: number;
  supporters: number;
  paragraphs: ParagraphDTO[];
}

export interface EarningsTotals {
  earned: string;
  tips: number;
  supporters: number;
  articles: number;
  /** Full-history sum of the writer's Claimed events (lifetime claimed). */
  claimed: string;
  /** Number of claims on record. */
  claims: number;
}

export interface EarningsResponse {
  chainId: number;
  author: string;
  totals: EarningsTotals;
  articles: ArticleDTO[];
  capped: { shown: number; total: number } | null;
}

export type EarningsState = "loading" | "error" | "done";

/**
 * Fetch a writer's full-history earnings from `/api/writer/[address]/earnings`.
 *
 * Single source for the dashboard's gross totals AND the "Lifetime claimed"
 * headline, so both numbers come from the same full-history scan and always
 * reconcile (the client-side `useWriterEarnings` hook only scans a recent
 * window and cannot back a "lifetime" figure).
 */
export function useWriterEarningsApi(address?: `0x${string}`) {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [state, setState] = useState<EarningsState>("loading");

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setState("loading");
    (async () => {
      try {
        const res = await fetch(`/api/writer/${address}/earnings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as EarningsResponse;
        if (!cancelled) {
          setData(json);
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

  return { data, state };
}
// @type: prefer readonly for immutable data
// @config: make this configurable via env

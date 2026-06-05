"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProtocolFee } from "@/hooks/useProtocolFee";

interface ParagraphDTO {
  index: number;
  snippet: string;
  total: string;
  count: number;
}

interface ArticleDTO {
  articleId: string;
  slug: string;
  blockNumber: string;
  total: string;
  count: number;
  supporters: number;
  paragraphs: ParagraphDTO[];
}

interface EarningsResponse {
  chainId: number;
  author: string;
  totals: { earned: string; tips: number; supporters: number; articles: number };
  articles: ArticleDTO[];
  capped: { shown: number; total: number } | null;
}

type LoadState = "loading" | "error" | "done";

/** Format a cUSD wei string for display, trimming trailing zeros. */
function cusd(wei: string): string {
  const n = Number(formatUnits(BigInt(wei), 18));
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/** How many top paragraphs to surface per article before "show all". */
const TOP_PARAGRAPHS = 5;

/**
 * W1 — full-history writer earnings: total tipped, and per-article which
 * paragraph earns most. Reads the server aggregation at
 * `/api/writer/[address]/earnings` (client RPC can't scan full history).
 */
export function WriterEarnings({ address }: { address: `0x${string}` }) {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const { feeBps, feePct } = useProtocolFee();

  useEffect(() => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Earnings by paragraph</CardTitle>
      </CardHeader>
      <CardContent>
        {state === "loading" ? (
          <p className="text-sm text-muted-foreground">Loading earnings…</p>
        ) : state === "error" ? (
          <p className="text-sm text-muted-foreground">
            Could not load earnings right now (RPC hiccup). Your pending balance
            above is unaffected — try refreshing in a moment.
          </p>
        ) : !data || data.articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No articles yet.{" "}
            <Link href="/write" className="underline-offset-4 hover:underline">
              Write your first one →
            </Link>
          </p>
        ) : (
          <div className="space-y-6">
            <TotalsStrip totals={data.totals} />
            {feeBps > 0 && (
              <p className="text-xs text-muted-foreground">
                Totals are gross tips. A {feePct}% protocol fee applies to new
                tips; your claimable balance (Pending tips, above) is already
                net of it.
              </p>
            )}
            <ul className="divide-y">
              {data.articles.map((a) => (
                <ArticleRow key={a.articleId} article={a} />
              ))}
            </ul>
            {data.capped && (
              <p className="text-xs text-muted-foreground">
                Showing your {data.capped.shown} most recent articles of{" "}
                {data.capped.total}.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TotalsStrip({
  totals,
}: {
  totals: EarningsResponse["totals"];
}) {
  const items: Array<{ label: string; value: string }> = [
    { label: "Total earned", value: `${cusd(totals.earned)} cUSD` },
    { label: "Tips", value: totals.tips.toLocaleString() },
    { label: "Supporters", value: totals.supporters.toLocaleString() },
    { label: "Articles", value: totals.articles.toLocaleString() },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg border bg-card/40 p-3">
          <div className="text-lg font-semibold tracking-tight">{it.value}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArticleRow({ article }: { article: ArticleDTO }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded
    ? article.paragraphs
    : article.paragraphs.slice(0, TOP_PARAGRAPHS);

  // Gap between headline total and the sum of mappable paragraphs = tips that
  // landed on earlier body versions (can't show their text).
  const paragraphSum = article.paragraphs.reduce(
    (acc, p) => acc + BigInt(p.total),
    0n,
  );
  const earlierVersions = BigInt(article.total) - paragraphSum;

  return (
    <li className="py-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <Link
          href={`/a/${article.articleId}`}
          className="text-sm font-medium hover:underline"
        >
          {article.slug || "(untitled)"}
        </Link>
        <span className="text-sm font-semibold">
          {cusd(article.total)} cUSD
        </span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {article.count} tip{article.count === 1 ? "" : "s"} ·{" "}
        {article.supporters} supporter{article.supporters === 1 ? "" : "s"}
      </p>

      {article.paragraphs.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          No tips on the current version yet.
        </p>
      ) : (
        <ol className="mt-3 space-y-2">
          {rows.map((p, i) => (
            <li key={p.index} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 w-5 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                {expanded ? p.index + 1 : i + 1}
              </span>
              <span className="min-w-0 flex-1 text-muted-foreground">
                {p.snippet}
              </span>
              <span className="shrink-0 text-right">
                <span className="font-medium">{cusd(p.total)}</span>{" "}
                <span className="text-[11px] text-muted-foreground">
                  ({p.count})
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-2 flex items-center gap-3">
        {article.paragraphs.length > TOP_PARAGRAPHS && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            {expanded
              ? "Show top paragraphs only"
              : `Show all ${article.paragraphs.length} tipped paragraphs`}
          </button>
        )}
        {earlierVersions > 0n && (
          <span className="text-[11px] text-muted-foreground">
            + {cusd(earlierVersions.toString())} cUSD on earlier versions
          </span>
        )}
      </div>
    </li>
  );
}

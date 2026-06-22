import Link from "next/link";
import { Pilcrow } from "lucide-react";
import { formatUnits } from "viem";

import { RevealOnScroll } from "@/components/hero/RevealOnScroll";
import { MANIFESTO } from "@/lib/manifesto";
import type { ParagraphRank } from "@/lib/leaderboard";

function cusd(total: string): string {
  return Number(formatUnits(BigInt(total), 18)).toFixed(2);
}

/**
 * Landing "ledger" - the most-tipped paragraphs, straight from the
 * on-chain leaderboard aggregation. Real data, mono tabular figures.
 */
export function LedgerSection({ paragraphs }: { paragraphs: ParagraphRank[] }) {
  return (
    <section className="border-t">
      <div className="container mx-auto max-w-5xl px-4 py-16 md:py-20">
        <RevealOnScroll>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            <span aria-hidden="true">¶</span> This week&apos;s ledger
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Most-tipped paragraphs.
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delay={0.06}>
        {paragraphs.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
            <Pilcrow
              className="h-8 w-8 text-muted-foreground/40"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="font-mono text-sm text-muted-foreground">
              No tips yet. Be the first to tip a paragraph.
            </p>
            <Link
              href={`/a/${MANIFESTO.articleId}`}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Read a piece →
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border bg-card font-mono text-sm">
            <div className="grid grid-cols-[36px_1fr_64px_84px] gap-3 border-b bg-secondary/50 px-5 py-3 text-[11px] uppercase tracking-[0.08em] text-muted-foreground sm:gap-4 sm:px-6">
              <span>#</span>
              <span>paragraph</span>
              <span className="text-right">tips</span>
              <span className="text-right">cUSD</span>
            </div>
            {paragraphs.map((p, i) => (
              <Link
                key={`${p.articleId}-${p.index ?? i}`}
                href={`/a/${p.articleId}`}
                className="grid grid-cols-[36px_1fr_64px_84px] items-center gap-3 border-b px-5 py-4 transition-colors last:border-b-0 hover:bg-secondary/40 sm:gap-4 sm:px-6"
              >
                <span className="font-semibold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="truncate font-sans text-foreground">
                  {p.snippet ? `“${p.snippet}”` : p.slug}
                </span>
                <span className="text-right tabular-nums text-muted-foreground">
                  {p.count}
                </span>
                <span className="text-right tabular-nums text-foreground">
                  {cusd(p.total)}
                </span>
              </Link>
            ))}
          </div>
        )}
        </RevealOnScroll>
      </div>
    </section>
  );
}
// @guard: validate before processing
// @type: narrow the generic constraint
// @cleanup: consolidate with sibling file

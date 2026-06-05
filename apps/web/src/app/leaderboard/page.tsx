import type { Metadata } from "next";
import Link from "next/link";
import { Flame, TrendingUp } from "lucide-react";
import { formatUnits, getAddress } from "viem";

import { RevealOnScroll } from "@/components/hero/RevealOnScroll";
import { displayName as ensDisplay, resolveEnsBatch } from "@/lib/ens";
import {
  getLeaderboard,
  type ArticleRank,
  type AuthorRank,
  type ParagraphRank,
} from "@/lib/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard — the best-paid paragraphs on TipiTip",
  description:
    "The most-tipped paragraphs, articles and writers on TipiTip, plus what readers are paying for right now.",
};

// On-chain data shifts slowly; let the page itself revalidate every 2 min too.
export const revalidate = 120;

function cusd(wei: string): string {
  return Number(formatUnits(BigInt(wei), 18)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

function ParagraphList({ items }: { items: ParagraphRank[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {items.map((p, i) => (
        <li key={`${p.articleId}-${p.index ?? i}`} className="flex gap-3">
          <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground/90">
              {p.snippet ?? "(paragraph from an earlier version)"}
            </p>
            <Link
              href={`/a/${p.articleId}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              {p.slug || "article"}
            </Link>
          </div>
          <span className="shrink-0 text-right text-sm font-medium">
            {cusd(p.total)} cUSD
          </span>
        </li>
      ))}
    </ol>
  );
}

export default async function LeaderboardPage() {
  const board = await getLeaderboard();

  const authorEns = await resolveEnsBatch(
    board.topAuthors.map((a) => getAddress(a.author)),
  );

  return (
    <main className="container mx-auto max-w-4xl px-4 py-16">
      <RevealOnScroll>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Leaderboard
        </p>
        <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight">
          The best-paid lines on the internet
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Every tip is real cUSD on Celo. This is what readers actually paid to
          reward, ranked.
        </p>
      </RevealOnScroll>

      {board.empty ? (
        <p className="mt-12 text-sm text-muted-foreground">
          No tips yet. Be the first to tip a paragraph and you will show up here.
        </p>
      ) : (
        <div className="mt-12 space-y-14">
          {board.trendingParagraphs.length > 0 && (
            <RevealOnScroll>
              <section>
                <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold">
                  <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
                  Trending now
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paragraphs getting tipped most in recent blocks.
                </p>
                <ParagraphList items={board.trendingParagraphs} />
              </section>
            </RevealOnScroll>
          )}

          <RevealOnScroll delay={0.05}>
            <section>
              <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold">
                <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
                Top paragraphs
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Most-tipped single lines, all time.
              </p>
              <ParagraphList items={board.topParagraphs} />
            </section>
          </RevealOnScroll>

          <RevealOnScroll delay={0.05}>
            <section>
              <h2 className="font-serif text-2xl font-semibold">Top articles</h2>
              <ol className="mt-4 space-y-3">
                {board.topArticles.map((a: ArticleRank, i) => (
                  <li key={a.articleId} className="flex items-baseline gap-3">
                    <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <Link
                      href={`/a/${a.articleId}`}
                      className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                    >
                      {a.slug || "(untitled)"}
                    </Link>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {cusd(a.total)} cUSD
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          </RevealOnScroll>

          <RevealOnScroll delay={0.05}>
            <section>
              <h2 className="font-serif text-2xl font-semibold">Top writers</h2>
              <ol className="mt-4 space-y-3">
                {board.topAuthors.map((a: AuthorRank, i) => {
                  const addr = getAddress(a.author);
                  return (
                    <li key={a.author} className="flex items-baseline gap-3">
                      <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      <Link
                        href={`/u/${a.author}`}
                        className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                      >
                        {ensDisplay(addr, authorEns.get(addr))}
                      </Link>
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {cusd(a.total)} cUSD
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          </RevealOnScroll>
        </div>
      )}
    </main>
  );
}

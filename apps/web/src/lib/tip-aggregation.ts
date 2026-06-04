/**
 * Pure aggregation helpers that turn raw `Tipped` logs into the per-paragraph
 * and per-article shapes the writer dashboard (W1) renders. Kept free of any
 * network/RPC concern so they are deterministic and unit-testable in isolation
 * (feed synthetic logs, assert totals).
 */
import type { Hex } from "viem";

import { splitParagraphs } from "./articles";
import type { RawEventLog } from "./chain-logs";
import { deriveParagraphKey } from "./paragraph-key";

/** Earnings for a single paragraph within an article. */
export interface ParagraphEarning {
  index: number;
  /** Short, plain-text preview of the paragraph for the writer to recognise it. */
  snippet: string;
  /** Total tipped to this paragraph, in cUSD smallest units (18 decimals). */
  total: bigint;
  /** Number of individual tips. */
  count: number;
}

/** Full earnings breakdown for one article. */
export interface ArticleEarnings {
  total: bigint;
  count: number;
  /** Distinct tipping wallets across the whole article. */
  supporters: number;
  /** Tipped paragraphs only, ranked highest-earning first. */
  paragraphs: ParagraphEarning[];
}

/** Collapse whitespace, drop common leading markdown markers, clamp length. */
export function paragraphSnippet(text: string, max = 120): string {
  const plain = text
    .replace(/```[\s\S]*?```/g, "[code]")
    .replace(/^#{1,6}\s+/g, "")
    .replace(/^[>\-*+]\s+/g, "")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
}

/**
 * Join an article's `Tipped` logs against the CURRENT body version to produce
 * a per-paragraph earnings breakdown.
 *
 * Headline `total` / `count` / `supporters` cover EVERY tip to the article
 * (this is the author's real, claimable money), regardless of which body
 * version was tipped. The per-paragraph list only includes tips whose
 * `paragraphKey` still maps to a current paragraph — tips on a since-edited or
 * re-ordered paragraph can't be shown with text, so they contribute to the
 * headline total but not to any row. As a result the rows may sum to less than
 * `total`; that gap is "tips on earlier versions" and is expected.
 */
export function aggregateArticleEarnings(
  articleId: Hex,
  body: string,
  tippedLogs: RawEventLog[],
): ArticleEarnings {
  const paragraphs = splitParagraphs(body);
  const indexByKey = new Map<string, number>();
  paragraphs.forEach((text, index) => {
    indexByKey.set(
      deriveParagraphKey(articleId, index, text).toLowerCase(),
      index,
    );
  });

  const perIndex = new Map<number, { total: bigint; count: number }>();
  const supporters = new Set<string>();
  let total = 0n;
  let count = 0;

  for (const log of tippedLogs) {
    const paragraphKey = (log.args.paragraphKey as Hex | undefined)?.toLowerCase();
    const amount = log.args.amount as bigint | undefined;
    const tipper = log.args.tipper as string | undefined;
    if (!paragraphKey || amount === undefined) continue;

    // Headline totals span all body versions.
    total += amount;
    count += 1;
    if (tipper) supporters.add(tipper.toLowerCase());

    // Per-paragraph rows only for tips that map to the current body.
    const index = indexByKey.get(paragraphKey);
    if (index === undefined) continue;
    const cur = perIndex.get(index) ?? { total: 0n, count: 0 };
    perIndex.set(index, { total: cur.total + amount, count: cur.count + 1 });
  }

  const rankedParagraphs: ParagraphEarning[] = [...perIndex.entries()]
    .map(([index, s]) => ({
      index,
      snippet: paragraphSnippet(paragraphs[index] ?? ""),
      total: s.total,
      count: s.count,
    }))
    .sort((a, b) => (b.total > a.total ? 1 : b.total < a.total ? -1 : 0));

  return { total, count, supporters: supporters.size, paragraphs: rankedParagraphs };
}

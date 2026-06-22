/**
 * Server-only global tip leaderboards + trending (C1 + C2).
 *
 * One full-history scan of every `Tipped` + `ArticleRegistered` event feeds all
 * four rankings, cached so the /leaderboard page never blocks on a cold scan.
 * At current volume (~12k tips) a getLogs sweep is fine; a subgraph becomes the
 * move once this is too heavy (the documented migration trigger).
 *
 * Trending uses block-age decay rather than wall-clock timestamps so it needs
 * no extra getBlock calls: a tip's weight is amount * exp(-ageBlocks/halflife).
 */
import "server-only";

import { unstable_cache } from "next/cache";
import type { Hex } from "viem";

import { getArticleBodyUrl } from "./blob";
import { fetchAllEvents, getActiveChainId } from "./chain-logs";
import { ADDRESSES, type SupportedChainId } from "./contracts";
import { paragraphIndexByKey } from "./tip-aggregation";

const TOP = 10;
/** ~3 days at Celo's ~1s blocks: tips this old contribute half their weight. */
const TREND_HALFLIFE_BLOCKS = 250_000;
/** Scale wei into micro-cUSD before Number() so trend math stays in safe range. */
const TREND_SCALE = 1_000_000_000_000n;

export interface ArticleRank {
  articleId: string;
  slug: string;
  author: string;
  total: string;
  count: number;
}
export interface AuthorRank {
  author: string;
  total: string;
  count: number;
  articles: number;
}
export interface ParagraphRank {
  articleId: string;
  slug: string;
  index: number | null;
  snippet: string | null;
  total: string;
  count: number;
}
export interface LeaderboardTotals {
  /** Sum of every tip amount, in wei (cUSD, 18 decimals). */
  tipped: string;
  /** Count of on-chain tips. */
  tips: number;
  /** Unique tippers (supporters). */
  supporters: number;
  /** Distinct authors who received tips. */
  authors: number;
}
export interface Leaderboard {
  topArticles: ArticleRank[];
  topAuthors: AuthorRank[];
  topParagraphs: ParagraphRank[];
  trendingParagraphs: ParagraphRank[];
  /** Platform-wide grand totals, from the same full-history scan. */
  totals: LeaderboardTotals;
  empty: boolean;
}

const EMPTY: Leaderboard = {
  topArticles: [],
  topAuthors: [],
  topParagraphs: [],
  trendingParagraphs: [],
  totals: { tipped: "0", tips: 0, supporters: 0, authors: 0 },
  empty: true,
};

function byTotalDesc(a: { total: bigint }, b: { total: bigint }): number {
  return b.total > a.total ? 1 : b.total < a.total ? -1 : 0;
}

async function loadBody(articleId: string): Promise<string | null> {
  try {
    const url = await getArticleBodyUrl(articleId);
    if (!url) return null;
    const res = await fetch(url, { next: { revalidate: 300 } });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

async function compute(): Promise<Leaderboard> {
  const chainId = getActiveChainId();
  if (chainId === null) return EMPTY;
  const tipJar = ADDRESSES[chainId as SupportedChainId]?.tipJar;
  if (!tipJar) return EMPTY;

  let tips, registers;
  try {
    [tips, registers] = await Promise.all([
      fetchAllEvents({ chainId, address: tipJar, eventName: "Tipped" }),
      fetchAllEvents({ chainId, address: tipJar, eventName: "ArticleRegistered" }),
    ]);
  } catch {
    return EMPTY;
  }
  if (tips.length === 0) return EMPTY;

  const meta = new Map<string, { author: string; slug: string }>();
  for (const r of registers) {
    const id = (r.args.articleId as Hex | undefined)?.toLowerCase();
    if (!id || meta.has(id)) continue;
    meta.set(id, {
      author: ((r.args.author as string) ?? "").toLowerCase(),
      slug: (r.args.slug as string) ?? "",
    });
  }

  let latestBlock = 0n;
  for (const t of tips) {
    const b = t.blockNumber ?? 0n;
    if (b > latestBlock) latestBlock = b;
  }

  const perArticle = new Map<string, { total: bigint; count: number }>();
  const perAuthor = new Map<
    string,
    { total: bigint; count: number; articles: Set<string> }
  >();
  const perPara = new Map<
    string,
    { articleId: string; key: string; total: bigint; count: number }
  >();
  const trend = new Map<string, number>();
  const supporters = new Set<string>();
  let grandTotal = 0n;
  let tipCount = 0;

  for (const t of tips) {
    const articleId = (t.args.articleId as Hex | undefined)?.toLowerCase();
    const pk = (t.args.paragraphKey as Hex | undefined)?.toLowerCase();
    const amount = t.args.amount as bigint | undefined;
    if (!articleId || !pk || amount === undefined) continue;
    const m = meta.get(articleId);

    grandTotal += amount;
    tipCount += 1;
    const tipper = (t.args.tipper as string | undefined)?.toLowerCase();
    if (tipper) supporters.add(tipper);

    const a = perArticle.get(articleId) ?? { total: 0n, count: 0 };
    perArticle.set(articleId, { total: a.total + amount, count: a.count + 1 });

    if (m) {
      const au =
        perAuthor.get(m.author) ??
        { total: 0n, count: 0, articles: new Set<string>() };
      au.total += amount;
      au.count += 1;
      au.articles.add(articleId);
      perAuthor.set(m.author, au);
    }

    const pkey = `${articleId}:${pk}`;
    const p =
      perPara.get(pkey) ?? { articleId, key: pk, total: 0n, count: 0 };
    perPara.set(pkey, {
      articleId,
      key: pk,
      total: p.total + amount,
      count: p.count + 1,
    });

    const ageBlocks = Number(latestBlock - (t.blockNumber ?? 0n));
    const decay = Math.exp(-ageBlocks / TREND_HALFLIFE_BLOCKS);
    const amt = Number(amount / TREND_SCALE);
    trend.set(pkey, (trend.get(pkey) ?? 0) + amt * decay);
  }

  const topArticles: ArticleRank[] = [...perArticle.entries()]
    .map(([articleId, v]) => ({ articleId, ...v }))
    .sort(byTotalDesc)
    .slice(0, TOP)
    .map((v) => ({
      articleId: v.articleId,
      slug: meta.get(v.articleId)?.slug ?? "",
      author: meta.get(v.articleId)?.author ?? "",
      total: v.total.toString(),
      count: v.count,
    }));

  const topAuthors: AuthorRank[] = [...perAuthor.entries()]
    .map(([author, v]) => ({ author, ...v }))
    .sort(byTotalDesc)
    .slice(0, TOP)
    .map((v) => ({
      author: v.author,
      total: v.total.toString(),
      count: v.count,
      articles: v.articles.size,
    }));

  const topParaRaw = [...perPara.values()].sort(byTotalDesc).slice(0, TOP);
  const trendParaRaw = [...perPara.values()]
    .map((p) => ({ p, score: trend.get(`${p.articleId}:${p.key}`) ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP)
    .map((x) => x.p);

  // Load bodies only for the articles that surface in either paragraph list.
  const involved = new Set<string>(
    [...topParaRaw, ...trendParaRaw].map((p) => p.articleId),
  );
  const snippetMaps = new Map<
    string,
    Map<string, { index: number; snippet: string }>
  >();
  await Promise.all(
    [...involved].map(async (id) => {
      const body = await loadBody(id);
      if (body) snippetMaps.set(id, paragraphIndexByKey(id as Hex, body));
    }),
  );

  const resolvePara = (p: {
    articleId: string;
    key: string;
    total: bigint;
    count: number;
  }): ParagraphRank => {
    const found = snippetMaps.get(p.articleId)?.get(p.key) ?? null;
    return {
      articleId: p.articleId,
      slug: meta.get(p.articleId)?.slug ?? "",
      index: found?.index ?? null,
      snippet: found?.snippet ?? null,
      total: p.total.toString(),
      count: p.count,
    };
  };

  return {
    topArticles,
    topAuthors,
    topParagraphs: topParaRaw.map(resolvePara),
    trendingParagraphs: trendParaRaw.map(resolvePara),
    totals: {
      tipped: grandTotal.toString(),
      tips: tipCount,
      supporters: supporters.size,
      authors: perAuthor.size,
    },
    empty: false,
  };
}

/** Cached global leaderboard. Revalidates every 2 minutes. */
export const getLeaderboard = unstable_cache(compute, ["leaderboard-v2"], {
  revalidate: 120,
  tags: ["leaderboard"],
});
/** @module leaderboard */
// @edge: handle nullish input gracefully
// @guard: validate at component boundary
// @edge: zero-value special case
// @a11y: verify screen-reader announcement
// @edge: zero-value special case

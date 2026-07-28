/**
 * Subgraph client for the TipiTip leaderboard.
 *
 * Reads pre-aggregated tip/article/author totals from the TipiTip subgraph
 * deployed to The Graph Studio on Celo mainnet, instead of rescanning full
 * chain history on every request (the ~90s scan that times out on Vercel
 * Hobby and the flaky blob-seed that undercounts tips).
 *
 * The subgraph is the primary source for `getLeaderboard`; the blob snapshot
 * stays as a fallback when the endpoint is unreachable. Trending uses the
 * same block-age-decay algorithm as `compute()` but over recently-indexed
 * tips fetched from the subgraph; paragraph snippets are enriched by
 * fetching article bodies (same `loadBody` + `paragraphIndexByKey` path).
 */
import "server-only";

import type { Hex } from "viem";

import { getArticleBodyUrl } from "./blob";
import {
  type ArticleRank,
  type AuthorRank,
  type Leaderboard,
  type ParagraphRank,
  TREND_HALFLIFE_BLOCKS,
  TREND_SCALE,
} from "./leaderboard";
import { paragraphIndexByKey } from "./tip-aggregation";

/** Subgraph query endpoint (The Graph Studio, Celo mainnet). Server-only. */
const SUBGRAPH_URL = process.env.SUBGRAPH_URL ?? "";

const TOP = 10;

interface SubgraphTip {
  article: { id: string; slug: string | null } | null;
  paragraph: { id: string } | null;
  amountWei: string;
  blockNumber: string;
  tipper: string;
}

async function gql<T>(query: string): Promise<T | null> {
  if (!SUBGRAPH_URL) return null;
  try {
    const res = await fetch(SUBGRAPH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T; errors?: unknown[] };
    if (json.errors) return null;
    return json.data ?? null;
  } catch {
    return null;
  }
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

/**
 * Fetch the leaderboard from the subgraph. Returns null on any failure so
 * the caller can fall back to the blob snapshot.
 */
export async function fetchLeaderboardFromSubgraph(): Promise<Leaderboard | null> {
  // Single multi-root query: stats + top lists + recent tips for trending.
  const data = await gql<{
    stats: {
      totalTips: string;
      totalSupporters: string;
      totalAuthors: string;
      totalTippedWei: string;
    }[];
    topArticles: {
      id: string;
      slug: string | null;
      totalWei: string;
      tipsCount: string;
      author: { id: string } | null;
    }[];
    topAuthors: {
      id: string;
      totalWei: string;
      tipsCount: string;
      articlesCount: string;
    }[];
    topParagraphs: {
      id: string;
      totalWei: string;
      tipsCount: string;
      article: { id: string; slug: string | null } | null;
    }[];
    recentTips: SubgraphTip[];
  }>(`
    {
      stats: globalStats(first: 1) {
        totalTips totalSupporters totalAuthors totalTippedWei
      }
      topArticles: articles(first: ${TOP}, orderBy: totalWei, orderDirection: desc) {
        id slug totalWei tipsCount author { id }
      }
      topAuthors: authors(first: ${TOP}, orderBy: totalWei, orderDirection: desc) {
        id totalWei tipsCount articlesCount
      }
      topParagraphs: paragraphs(first: ${TOP}, orderBy: totalWei, orderDirection: desc) {
        id totalWei tipsCount article { id slug }
      }
      recentTips: tips(first: 500, orderBy: blockNumber, orderDirection: desc) {
        article { id slug }
        paragraph { id }
        amountWei blockNumber tipper
      }
    }
  `);
  if (!data) return null;
  const stat = data.stats[0];
  if (!stat) return null;

  // Trending: block-age decay over recent tips, same algorithm as compute().
  let latestBlock = 0n;
  for (const t of data.recentTips) {
    const b = BigInt(t.blockNumber);
    if (b > latestBlock) latestBlock = b;
  }
  const trend = new Map<
    string,
    { articleId: string; paragraphId: string; total: bigint; count: number; score: number }
  >();
  for (const t of data.recentTips) {
    const pid = t.paragraph?.id;
    const aid = t.article?.id;
    if (!pid || !aid) continue;
    const amount = BigInt(t.amountWei);
    const ageBlocks = Number(latestBlock - BigInt(t.blockNumber));
    const decay = Math.exp(-ageBlocks / TREND_HALFLIFE_BLOCKS);
    const amt = Number(amount / TREND_SCALE);
    const key = `${aid}:${pid}`;
    const cur = trend.get(key) ??
      { articleId: aid, paragraphId: pid, total: 0n, count: 0, score: 0 };
    cur.total += amount;
    cur.count += 1;
    cur.score += amt * decay;
    trend.set(key, cur);
  }
  const trendingParaRaw = [...trend.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP);

  const topArticles: ArticleRank[] = data.topArticles.map((a) => ({
    articleId: a.id,
    slug: a.slug ?? "",
    author: a.author?.id ?? "",
    total: a.totalWei,
    count: Number(a.tipsCount),
  }));

  const topAuthors: AuthorRank[] = data.topAuthors.map((a) => ({
    author: a.id,
    total: a.totalWei,
    count: Number(a.tipsCount),
    articles: Number(a.articlesCount),
  }));

  // Paragraph lists (top + trending), then enrich with article-body snippets.
  const paraTopRaw = data.topParagraphs.map((p) => ({
    articleId: p.article?.id ?? "",
    paragraphId: p.id,
    slug: p.article?.slug ?? "",
    total: p.totalWei,
    count: Number(p.tipsCount),
  }));
  const paraTrendRaw = trendingParaRaw.map((p) => ({
    articleId: p.articleId,
    paragraphId: p.paragraphId,
    slug: data.recentTips.find((t) => t.article?.id === p.articleId)?.article?.slug ?? "",
    total: p.total.toString(),
    count: p.count,
  }));

  const involved = new Set<string>([
    ...paraTopRaw.map((p) => p.articleId),
    ...paraTrendRaw.map((p) => p.articleId),
  ].filter(Boolean));
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
    paragraphId: string;
    slug: string;
    total: string;
    count: number;
  }): ParagraphRank => {
    const found = snippetMaps.get(p.articleId)?.get(p.paragraphId) ?? null;
    return {
      articleId: p.articleId,
      slug: p.slug,
      index: found?.index ?? null,
      snippet: found?.snippet ?? null,
      total: p.total,
      count: p.count,
    };
  };

  const topParagraphs = paraTopRaw.map(resolvePara);
  const trendingParagraphs = paraTrendRaw.map(resolvePara);

  return {
    topArticles,
    topAuthors,
    topParagraphs,
    trendingParagraphs,
    totals: {
      tipped: stat.totalTippedWei,
      tips: Number(stat.totalTips),
      supporters: Number(stat.totalSupporters),
      authors: Number(stat.totalAuthors),
    },
    empty: false,
  };
}

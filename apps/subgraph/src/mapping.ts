// TipiTip subgraph mappings.
//
// One handler per TipJar event. Each handler upserts the entities defined
// in schema.graphql so the web leaderboard can query pre-aggregated totals
// instead of rescanning full chain history (the 90s scan that times out on
// Vercel Hobby). GlobalStat is a singleton (id "1") updated on every tip.

import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  ArticleRegistered,
  Claimed,
  Supported,
  Tipped,
} from "../generated/TipJar/TipJar";
import { Article, Author, GlobalStat, Paragraph, Supporter, Tip } from "../generated/schema";

const GLOBAL_STAT_ID = "1";

function zeroStat(): GlobalStat {
  let stat = new GlobalStat(GLOBAL_STAT_ID);
  stat.totalTippedWei = BigInt.fromI32(0);
  stat.totalTips = BigInt.fromI32(0);
  stat.totalSupporters = BigInt.fromI32(0);
  stat.totalAuthors = BigInt.fromI32(0);
  return stat;
}

function getOrCreateStat(): GlobalStat {
  let stat = GlobalStat.load(GLOBAL_STAT_ID);
  if (stat === null) {
    stat = zeroStat();
  }
  return stat as GlobalStat;
}

function getOrCreateAuthor(addr: Address): Author {
  let id = addr.toHexString();
  let author = Author.load(id);
  if (author === null) {
    author = new Author(id);
    author.totalWei = BigInt.fromI32(0);
    author.tipsCount = BigInt.fromI32(0);
    author.articlesCount = BigInt.fromI32(0);
  }
  return author as Author;
}

function getOrCreateSupporter(addr: Address): Supporter {
  let id = addr.toHexString();
  let supporter = Supporter.load(id);
  if (supporter === null) {
    supporter = new Supporter(id);
    supporter.totalTippedWei = BigInt.fromI32(0);
    supporter.tipsCount = BigInt.fromI32(0);
  }
  return supporter as Supporter;
}

export function handleArticleRegistered(event: ArticleRegistered): void {
  let articleId = event.params.articleId.toHexString();
  let authorAddr = event.params.author;
  let author = getOrCreateAuthor(authorAddr);

  let isNewArticle = Article.load(articleId) === null;
  let article = new Article(articleId);
  article.slug = event.params.slug;
  article.author = author.id;
  article.contentHash = event.params.contentHash;
  article.totalWei = BigInt.fromI32(0);
  article.tipsCount = BigInt.fromI32(0);
  article.registeredAtBlock = event.block.number;
  article.registeredAtTimestamp = event.block.timestamp;
  article.save();

  if (isNewArticle) {
    author.articlesCount = author.articlesCount.plus(BigInt.fromI32(1));
    author.save();

    let stat = getOrCreateStat();
    stat.totalAuthors = stat.totalAuthors.plus(BigInt.fromI32(1));
    stat.save();
  }
}

export function handleTipped(event: Tipped): void {
  let articleId = event.params.articleId.toHexString();
  let paragraphId = event.params.paragraphKey.toHexString();
  let tipperAddr = event.params.tipper;
  let amount = event.params.amount;

  let article = Article.load(articleId);
  if (article === null) {
    // Tip on an unregistered article should not happen (frontend registers
    // first), but guard so indexing never aborts.
    log.warning("Tipped for unregistered article {}", [articleId]);
    return;
  }
  let a = article as Article;

  let paragraph = Paragraph.load(paragraphId);
  if (paragraph === null) {
    paragraph = new Paragraph(paragraphId);
    paragraph.article = a.id;
    paragraph.totalWei = BigInt.fromI32(0);
    paragraph.tipsCount = BigInt.fromI32(0);
  }
  let p = paragraph as Paragraph;
  p.totalWei = p.totalWei.plus(amount);
  p.tipsCount = p.tipsCount.plus(BigInt.fromI32(1));
  p.save();

  let author = getOrCreateAuthor(Address.fromString(a.author));
  author.totalWei = author.totalWei.plus(amount);
  author.tipsCount = author.tipsCount.plus(BigInt.fromI32(1));
  author.save();

  let supporter = getOrCreateSupporter(tipperAddr);
  let isNewSupporter = supporter.tipsCount.equals(BigInt.fromI32(0));
  supporter.totalTippedWei = supporter.totalTippedWei.plus(amount);
  supporter.tipsCount = supporter.tipsCount.plus(BigInt.fromI32(1));
  supporter.save();

  a.totalWei = a.totalWei.plus(amount);
  a.tipsCount = a.tipsCount.plus(BigInt.fromI32(1));
  a.save();

  let tip = new Tip(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString(),
  );
  tip.article = a.id;
  tip.paragraph = p.id;
  tip.tipper = tipperAddr.toHexString();
  tip.amountWei = amount;
  tip.blockNumber = event.block.number;
  tip.timestamp = event.block.timestamp;
  tip.save();

  let stat = getOrCreateStat();
  stat.totalTippedWei = stat.totalTippedWei.plus(amount);
  stat.totalTips = stat.totalTips.plus(BigInt.fromI32(1));
  if (isNewSupporter) {
    stat.totalSupporters = stat.totalSupporters.plus(BigInt.fromI32(1));
  }
  stat.save();
}

export function handleClaimed(event: Claimed): void {
  // Claims move cUSD out of the contract; they do not change tip totals.
  // Indexed for completeness / future author-earnings UI; no aggregate
  // mutation needed here.
}

export function handleSupported(event: Supported): void {
  // On-chain support signal (TipiTipSupport). Separate from tips; tracked
  // via the Supporter entity if needed in the future. No leaderboard impact.
}


/**
 * Seed the TipJar with curated launch-day articles.
 *
 * For each markdown file under `../web/seed/articles/*.md`:
 *   1. Extract the H1 title → derive a URL-safe slug.
 *   2. Compute `articleId = keccak256(packed(author, slug))`.
 *   3. POST the body to the live Vercel `/api/articles` endpoint, which
 *      uploads to Vercel Blob and returns the content hash.
 *   4. Submit `registerArticle(articleId, contentHash, slug)` on-chain.
 *
 * Idempotent: skips any article whose `articleId` already has an author
 * on the TipJar (i.e. has been registered in a previous run).
 *
 * Required env vars:
 *   PRIVATE_KEY        Deployer key (same key that controls the TipJar owner).
 *   TIPJAR_ADDRESS     Proxy address for the target network.
 *   PUBLISH_API_URL    Base URL of the deployed web app, e.g.
 *                      `https://tipitip-sable.vercel.app`.
 *
 * Usage:
 *   pnpm hardhat run scripts/seed-articles.ts --network celo-sepolia
 *   pnpm hardhat run scripts/seed-articles.ts --network celo
 */

import fs from "node:fs";
import path from "node:path";
import hre from "hardhat";

interface SeedArticle {
  filename: string;
  slug: string;
  body: string;
}

interface PublishResponse {
  articleId: string;
  contentHash: string;
  storedAt: string;
}

const SEED_DIR = path.resolve(__dirname, "../../web/seed/articles");
const MAX_SLUG_LENGTH = 80; // mirror apps/web/src/lib/articles.ts

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

function extractTitle(markdown: string, filename: string): string {
  const firstHeading = markdown
    .split(/\r?\n/)
    .find((line) => line.startsWith("# "));
  if (!firstHeading) {
    throw new Error(`${filename}: missing H1 (# Title) on first line`);
  }
  return firstHeading.slice(2).trim();
}

function loadSeedArticles(): SeedArticle[] {
  if (!fs.existsSync(SEED_DIR)) {
    throw new Error(`seed dir not found: ${SEED_DIR}`);
  }
  const files = fs
    .readdirSync(SEED_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();
  if (files.length === 0) {
    throw new Error(`no .md files under ${SEED_DIR}`);
  }
  return files.map((filename) => {
    const body = fs.readFileSync(path.join(SEED_DIR, filename), "utf8");
    const title = extractTitle(body, filename);
    const slug = toSlug(title);
    if (!slug) {
      throw new Error(`${filename}: slug derivation produced empty string`);
    }
    return { filename, slug, body };
  });
}

async function publishToBlob(
  apiBase: string,
  payload: { articleId: string; slug: string; body: string },
): Promise<PublishResponse> {
  const res = await fetch(`${apiBase.replace(/\/+$/, "")}/api/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    // Already uploaded — Blob is content-addressed, so this means a
    // previous run got partway. Re-derive the contentHash locally.
    const { keccak256, stringToBytes } = await import("viem");
    return {
      articleId: payload.articleId,
      contentHash: keccak256(stringToBytes(payload.body)),
      storedAt: "already-stored",
    };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`publish failed ${res.status}: ${text}`);
  }
  return (await res.json()) as PublishResponse;
}

async function main(): Promise<void> {
  const apiBase = process.env.PUBLISH_API_URL?.trim();
  const tipJarAddress = process.env.TIPJAR_ADDRESS?.trim();
  if (!apiBase) throw new Error("PUBLISH_API_URL env var is required");
  if (!tipJarAddress) throw new Error("TIPJAR_ADDRESS env var is required");

  const { ethers, network } = hre;
  const [signer] = await ethers.getSigners();
  const author = await signer.getAddress();

  // eslint-disable-next-line no-console
  console.log(`\nSeeding TipJar on network=${network.name}`);
  // eslint-disable-next-line no-console
  console.log(`  TipJar  = ${tipJarAddress}`);
  // eslint-disable-next-line no-console
  console.log(`  author  = ${author}`);
  // eslint-disable-next-line no-console
  console.log(`  apiBase = ${apiBase}\n`);

  const tipJar = await ethers.getContractAt("TipJar", tipJarAddress, signer);
  const articles = loadSeedArticles();

  for (const article of articles) {
    const articleId = ethers.solidityPackedKeccak256(
      ["address", "string"],
      [author, article.slug],
    );

    const existingAuthor: string = await tipJar.articleAuthor(articleId);
    if (existingAuthor !== ethers.ZeroAddress) {
      // eslint-disable-next-line no-console
      console.log(
        `↪ skip  ${article.slug}  (already registered to ${existingAuthor})`,
      );
      continue;
    }

    // 1. Upload markdown body to Vercel Blob via live API.
    const blob = await publishToBlob(apiBase, {
      articleId,
      slug: article.slug,
      body: article.body,
    });
    // eslint-disable-next-line no-console
    console.log(
      `· blob  ${article.slug}  contentHash=${blob.contentHash.slice(0, 14)}…`,
    );

    // 2. Register on-chain.
    const tx = await tipJar.registerArticle(
      articleId,
      blob.contentHash,
      article.slug,
    );
    const rcpt = await tx.wait();
    // eslint-disable-next-line no-console
    console.log(
      `✓ chain ${article.slug}  block=${rcpt?.blockNumber}  txHash=${rcpt?.hash}\n`,
    );
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${articles.length} articles.\n`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

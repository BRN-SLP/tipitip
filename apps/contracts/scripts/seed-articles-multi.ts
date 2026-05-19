/**
 * Multi-author seeding for the TipiTip Latest grid.
 *
 * Extension of `seed-articles.ts` that distributes new markdown bodies
 * across multiple author wallets instead of registering everything from
 * a single deployer key. Result: the Latest grid renders a mix of
 * different bylines (each `ArticleRegistered` event carries the
 * registering wallet as `author`), which is what the landing was
 * missing — every previous seeded article had the same author.
 *
 * Uses viem directly (not Hardhat's ethers) so iterating over N keys
 * is just N walletClients, no juggling `hardhat.config.ts` `accounts`
 * arrays.
 *
 * Required env:
 *   SEEDER_<N>_KEY     One private key per author. The SEED_PLAN below
 *                      references SEEDER_1_KEY … SEEDER_6_KEY by index.
 *   PUBLISH_API_URL    Live web app base URL, same as seed-articles.ts.
 *   TIPJAR_ADDRESS     TipJar proxy address for the target chain.
 *   CHAIN              'celo' | 'celoSepolia' (default 'celo').
 *
 * Behavior:
 *   - Idempotent: skips any (author, slug) pair whose articleId already
 *     has a non-zero author set on the TipJar contract.
 *   - Skips authors whose CELO balance is below MIN_BALANCE_WEI with a
 *     loud log line so the user knows which address to top up.
 *   - Logs everything to stdout in a way that's grep-friendly.
 *
 * Usage:
 *   set -a; source ../../.secrets/seed-authors.env; set +a
 *   PUBLISH_API_URL=https://tipitip-sable.vercel.app \
 *   TIPJAR_ADDRESS=0x... \
 *   npx tsx scripts/seed-articles-multi.ts
 */

import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  encodePacked,
  formatEther,
  http,
  keccak256,
  stringToBytes,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, celoSepolia } from "viem/chains";

import { tipJarAbi } from "../../web/src/lib/abi";

const SEED_DIR = path.resolve(__dirname, "../../web/seed/articles");
const MAX_SLUG_LENGTH = 80;

/**
 * Per-article plan. Each entry assigns ONE markdown file to ONE author
 * (referenced by 1-indexed seeder number). Keep the mapping deliberate
 * — the article content is voiced from a specific persona, and the
 * Latest grid surfaces the address as the byline, so the persona and
 * the wallet should stay paired across reruns.
 */
const SEED_PLAN: Array<{ file: string; seederIndex: number }> = [
  { file: "07-a-week-of-paragraph-tipping.md", seederIndex: 1 },
  { file: "08-things-id-build-into-tipitip.md", seederIndex: 2 },
  { file: "09-notes-on-usdc-yield-exit.md", seederIndex: 3 },
  { file: "10-what-sub-cent-gas-actually-unlocks.md", seederIndex: 4 },
  { file: "11-after-gpt5-what-writers-cost.md", seederIndex: 5 },
  { file: "12-long-context-models-and-citations.md", seederIndex: 6 },
];

/** Minimum CELO balance required to attempt a registerArticle tx. */
const MIN_BALANCE_WEI = 5_000_000_000_000_000n; // 0.005 CELO

interface PublishResponse {
  articleId: string;
  contentHash: string;
}

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

function extractTitle(markdown: string, filename: string): string {
  const heading = markdown
    .split(/\r?\n/)
    .find((line) => line.startsWith("# "));
  if (!heading) {
    throw new Error(`${filename}: missing H1 (# Title) on first line`);
  }
  return heading.slice(2).trim();
}

function deriveArticleId(author: Address, slug: string): Hex {
  return keccak256(encodePacked(["address", "string"], [author, slug]));
}

function deriveContentHash(body: string): Hex {
  return keccak256(stringToBytes(body));
}

async function publishToBlob(
  apiBase: string,
  payload: { articleId: Hex; slug: string; body: string },
): Promise<PublishResponse> {
  const res = await fetch(`${apiBase.replace(/\/+$/, "")}/api/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    // Body already in Blob from a previous partial run. Re-derive hash.
    return {
      articleId: payload.articleId,
      contentHash: deriveContentHash(payload.body),
    };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`publish failed ${res.status}: ${text}`);
  }
  return (await res.json()) as PublishResponse;
}

interface SeederContext {
  index: number;
  account: ReturnType<typeof privateKeyToAccount>;
  wallet: WalletClient;
}

function buildSeeders(chain: typeof celo | typeof celoSepolia): SeederContext[] {
  const seeders: SeederContext[] = [];
  for (let i = 1; i <= 6; i++) {
    const rawKey = process.env[`SEEDER_${i}_KEY`];
    if (!rawKey) continue;
    const key = rawKey.startsWith("0x") ? (rawKey as Hex) : (`0x${rawKey}` as Hex);
    const account = privateKeyToAccount(key);
    const wallet = createWalletClient({ account, chain, transport: http() });
    seeders.push({ index: i, account, wallet });
  }
  return seeders;
}

async function main(): Promise<void> {
  const apiBase = process.env.PUBLISH_API_URL?.trim();
  const tipJarAddress = process.env.TIPJAR_ADDRESS?.trim() as Address | undefined;
  const chainName = (process.env.CHAIN ?? "celo").trim();
  if (!apiBase) throw new Error("PUBLISH_API_URL env var is required");
  if (!tipJarAddress) throw new Error("TIPJAR_ADDRESS env var is required");
  const chain = chainName === "celoSepolia" ? celoSepolia : celo;

  const publicClient = createPublicClient({ chain, transport: http() });
  const seeders = buildSeeders(chain);
  if (seeders.length === 0) {
    throw new Error("no SEEDER_*_KEY env vars set");
  }

  // eslint-disable-next-line no-console
  console.log(`\nMulti-author seed on chain=${chain.name}`);
  // eslint-disable-next-line no-console
  console.log(`  TipJar  = ${tipJarAddress}`);
  // eslint-disable-next-line no-console
  console.log(`  apiBase = ${apiBase}`);
  // eslint-disable-next-line no-console
  console.log(`  authors = ${seeders.length}\n`);

  let published = 0;
  let skipped = 0;
  let needGas: string[] = [];

  for (const plan of SEED_PLAN) {
    const seeder = seeders.find((s) => s.index === plan.seederIndex);
    if (!seeder) {
      // eslint-disable-next-line no-console
      console.log(`✗ ${plan.file}  no SEEDER_${plan.seederIndex}_KEY in env`);
      skipped++;
      continue;
    }

    const filePath = path.join(SEED_DIR, plan.file);
    if (!fs.existsSync(filePath)) {
      // eslint-disable-next-line no-console
      console.log(`✗ ${plan.file}  file not found`);
      skipped++;
      continue;
    }
    const body = fs.readFileSync(filePath, "utf8");
    const title = extractTitle(body, plan.file);
    const slug = toSlug(title);
    const author = seeder.account.address;
    const articleId = deriveArticleId(author, slug);

    // 1. Idempotency check — was this article already registered?
    const existing = (await publicClient.readContract({
      address: tipJarAddress,
      abi: tipJarAbi,
      functionName: "articleAuthor",
      args: [articleId],
    })) as Address;
    if (existing !== "0x0000000000000000000000000000000000000000") {
      // eslint-disable-next-line no-console
      console.log(`↪ skip   ${plan.file}  already registered to ${existing}`);
      skipped++;
      continue;
    }

    // 2. Balance check — skip if author can't pay gas.
    const bal = await publicClient.getBalance({ address: author });
    if (bal < MIN_BALANCE_WEI) {
      // eslint-disable-next-line no-console
      console.log(
        `⛽ skip   ${plan.file}  seeder_${plan.seederIndex} ${author} needs gas (balance=${formatEther(bal)} CELO)`,
      );
      needGas.push(author);
      skipped++;
      continue;
    }

    // 3. Upload body to Blob via the live API route.
    const blob = await publishToBlob(apiBase, { articleId, slug, body });
    // eslint-disable-next-line no-console
    console.log(
      `· blob   ${plan.file}  slug=${slug}  hash=${blob.contentHash.slice(0, 14)}…`,
    );

    // 4. Register on-chain from THIS author's wallet.
    const hash = await seeder.wallet.writeContract({
      account: seeder.account,
      chain,
      address: tipJarAddress,
      abi: tipJarAbi,
      functionName: "registerArticle",
      args: [articleId, blob.contentHash as Hex, slug],
    });
    const rcpt = await publicClient.waitForTransactionReceipt({ hash });
    // eslint-disable-next-line no-console
    console.log(
      `✓ chain  ${plan.file}  author=${author}  block=${rcpt.blockNumber}  tx=${hash}`,
    );
    published++;
  }

  // eslint-disable-next-line no-console
  console.log(
    `\nResult: published=${published}  skipped=${skipped}  needGas=${needGas.length}`,
  );
  if (needGas.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`\nAddresses needing CELO for gas:`);
    for (const addr of needGas) {
      // eslint-disable-next-line no-console
      console.log(`  ${addr}`);
    }
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

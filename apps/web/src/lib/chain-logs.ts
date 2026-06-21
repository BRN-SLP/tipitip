/**
 * Server-only full-history event reader for the TipJar contract.
 *
 * Forno (Celo's public RPC) rejects an unbounded `eth_getLogs` range, so every
 * historical scan has to paginate. The landing feed (`articles-feed.ts`) solved
 * this once for `ArticleRegistered`; this module generalises the same
 * deploy-block pagination so any feature that needs the COMPLETE on-chain
 * history (writer earnings, leaderboards, trending) can share it instead of
 * each re-inventing a block window.
 *
 * Why not reuse the short-window endpoints: `useTippedEvents` (500k blocks) and
 * `/api/tip-stats` (200k blocks) deliberately scan only the recent tail to stay
 * cheap for live counters and external embeds. A writer's "which line earns
 * most" needs ALL of an article's tips, not the last few days, hence this.
 */
import "server-only";

import {
  createPublicClient,
  http,
  type Abi,
  type PublicClient,
} from "viem";
import { celo, celoSepolia } from "viem/chains";

import { ADDRESSES, tipJarAbi } from "./contracts";

/** Public RPC endpoint per chain. */
const RPC: Record<number, string> = {
  [celo.id]: "https://forno.celo.org",
  [celoSepolia.id]: "https://forno.celo-sepolia.celo-testnet.org/",
};

/**
 * Block at which each TipJar proxy was deployed; full-history scans start here.
 * Single source of truth — `lib/articles-feed.ts` imports this.
 */
export const DEPLOY_BLOCK: Record<number, bigint> = {
  [celo.id]: 67_086_457n,
};

/** Forno is comfortable with ~1M-block getLogs ranges; stay just under. */
const CHUNK = 900_000n;

/** Minimal decoded log shape returned to callers (event-agnostic). */
export interface RawEventLog {
  args: Record<string, unknown>;
  blockNumber: bigint | null;
  transactionHash: `0x${string}` | null;
}

/** Resolve the active chain (mainnet if its TipJar is configured, else Sepolia). */
/**
 * @description getActiveChainId — core logic for ${NAME}
 * @returns Result of getActiveChainId computation
 */
export function getActiveChainId(): number | null {
  if (ADDRESSES[celo.id]?.tipJar) return celo.id;
  if (ADDRESSES[celoSepolia.id]?.tipJar) return celoSepolia.id;
  return null;
}

/** Build a viem public client for a chain known to `RPC`. */
/**
 * @description buildClient — core logic for ${NAME}
 * @returns Result of buildClient computation
 */
export function buildClient(chainId: number): PublicClient {
  const chain = chainId === celo.id ? celo : celoSepolia;
  return createPublicClient({
    chain,
    // Bound each RPC call so a degraded Forno node cannot hold a serverless
    // function open until the platform timeout.
    transport: http(RPC[chainId], { timeout: 10_000 }),
  }) as PublicClient;
}

export interface FetchAllEventsArgs {
  chainId: number;
  address: `0x${string}`;
  eventName: string;
  /** Indexed-param filter (e.g. `{ author }` or `{ articleId }`). */
  args?: Record<string, unknown>;
  abi?: Abi;
}

/**
 * Read every matching event from the contract's deploy block to the latest
 * block, paginating in {@link CHUNK}-sized ranges. Indexed `args` are pushed
 * down to the node so a scan scoped to one author or one article stays cheap
 * even across full history.
 */
/**
 * @description fetchAllEvents — core logic for ${NAME}
 * @returns Result of fetchAllEvents computation
 */
export async function fetchAllEvents({
  chainId,
  address,
  eventName,
  args,
  abi = tipJarAbi as Abi,
}: FetchAllEventsArgs): Promise<RawEventLog[]> {
  const client = buildClient(chainId);
  const latest = await client.getBlockNumber();
  const floor =
    DEPLOY_BLOCK[chainId] ??
    (latest > 1_000_000n ? latest - 1_000_000n : 0n);

  const out: RawEventLog[] = [];
  for (let from = floor; from <= latest; from = from + CHUNK + 1n) {
    const to = from + CHUNK < latest ? from + CHUNK : latest;
    const logs = await client.getContractEvents({
      address,
      abi,
      eventName,
      args,
      fromBlock: from,
      toBlock: to,
    } as Parameters<PublicClient["getContractEvents"]>[0]);
    out.push(...(logs as unknown as RawEventLog[]));
  }
  return out;
}
/** @module chain-logs */
// @a11y: verify screen-reader announcement

/**
 * Server-only full-history event reader for the TipJar contract.
 *
 * Forno (Celo's public RPC) limits `eth_getLogs` to 5,000 blocks per request
 * on Celo L2. The old implementation used `client.getContractEvents` with
 * 900,000-block chunks and silently returned empty on Vercel, so all
 * historical posts and tips disappeared from the site.
 *
 * This version paginates in 5K-block chunks and decodes raw logs with viem's
 * `decodeEventLog`. To keep full-history scans inside the Vercel serverless
 * timeout, chunks are fetched in parallel batches of 30.
 *
 * DEPLOY_BLOCK is the fixed project-history start block: history is never
 * redefined as a sliding "last N blocks" window.
 */
import "server-only";

import {
  createPublicClient,
  http,
  decodeEventLog,
  getEventSelector,
  type Abi,
  type AbiEvent,
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
 * Block at which the TipJar proxy was deployed; this is the fixed start of
 * the project history. All full-history scans begin here so posts and tips
 * never roll out of a sliding block window as the chain advances.
 */
export const DEPLOY_BLOCK: Record<number, bigint> = {
  [celo.id]: 67_086_457n,
};

/** Celo L2 Forno limits eth_getLogs to 5,000 blocks per request. */
const CHUNK = 4_999n;

/**
 * How many 5K chunks to fetch in parallel. Tuned to stay inside the Vercel
 * serverless timeout while not hammering Forno. 30 is the sweet spot for Celo
 * mainnet: 50+ starts dropping early chunks under load.
 */
const PARALLEL_BATCH = 30;

/**
 * Bound each RPC call so a degraded node cannot hold a serverless function
 * open until the platform timeout.
 */
const RPC_TIMEOUT_MS = 15_000;

/** Minimal decoded log shape returned to callers (event-agnostic). */
export interface RawEventLog {
  args: Record<string, unknown>;
  blockNumber: bigint | null;
  transactionHash: `0x${string}` | null;
}

/** Resolve the active chain (mainnet if its TipJar is configured, else Sepolia). */
export function getActiveChainId(): number | null {
  if (ADDRESSES[celo.id]?.tipJar) return celo.id;
  if (ADDRESSES[celoSepolia.id]?.tipJar) return celoSepolia.id;
  return null;
}

/** Build a viem public client for a chain known to `RPC`. */
export function buildClient(chainId: number): PublicClient {
  const chain = chainId === celo.id ? celo : celoSepolia;
  return createPublicClient({
    chain,
    transport: http(RPC[chainId], { timeout: RPC_TIMEOUT_MS }),
  }) as PublicClient;
}

export interface FetchAllEventsArgs {
  chainId: number;
  address: `0x${string}`;
  eventName: string;
  /** Indexed-param filter (e.g. `{ author }` or `{ articleId }`). */
  args?: Record<string, unknown>;
  abi?: Abi;
  /** Reuse an existing client (e.g. when scanning several event types). */
  client?: PublicClient;
}

/**
 * Read every matching event from the contract's deploy block to the latest
 * block, paginating in 5K-block ranges and decoding raw logs locally.
 * Indexed `args` are pushed down to the node when provided.
 */
export async function fetchAllEvents({
  chainId,
  address,
  eventName,
  args,
  abi = tipJarAbi as Abi,
  client,
}: FetchAllEventsArgs): Promise<RawEventLog[]> {
  const c = client ?? buildClient(chainId);
  const latest = await c.getBlockNumber();
  const floor =
    DEPLOY_BLOCK[chainId] ??
    (latest > 1_000_000n ? latest - 1_000_000n : 0n);

  const abiEvents = (abi as Abi).filter(
    (item): item is AbiEvent =>
      typeof item === "object" &&
      item !== null &&
      "type" in item &&
      item.type === "event" &&
      "name" in item &&
      item.name === eventName,
  );
  if (abiEvents.length === 0) {
    throw new Error(`Event ${eventName} not found in ABI`);
  }

  const eventAbi = abiEvents[0];
  const inputs =
    "inputs" in eventAbi && Array.isArray(eventAbi.inputs) ? eventAbi.inputs : [];
  const indexedInputs = inputs.filter((input) => input?.indexed);

  // Build topic filters: topic0 is always the event signature so Forno only
  // returns matching logs. Indexed args are appended positionally when a caller
  // passes them in `args`.
  const eventSelector = getEventSelector(eventAbi);
  const topics: (string | null)[] = [eventSelector];
  for (const input of indexedInputs) {
    if (args && input?.name && args[input.name] !== undefined) {
      const val = args[input.name];
      if (typeof val === "string") {
        topics.push(val as `0x${string}`);
      } else if (typeof val === "bigint") {
        topics.push(`0x${val.toString(16).padStart(64, "0")}`);
      } else {
        topics.push(null);
      }
    } else {
      topics.push(null);
    }
  }

  const out: RawEventLog[] = [];

  // Build chunk boundaries.
  const ranges: { from: bigint; to: bigint }[] = [];
  for (let from = floor; from <= latest; from = from + CHUNK + 1n) {
    const to = from + CHUNK < latest ? from + CHUNK : latest;
    ranges.push({ from, to });
  }

  // Fetch chunks in parallel batches.
  for (let i = 0; i < ranges.length; i += PARALLEL_BATCH) {
    const batch = ranges.slice(i, i + PARALLEL_BATCH);
    const results = await Promise.all(
      batch.map(async ({ from, to }) => {
        const params: {
          address: `0x${string}`;
          fromBlock: `0x${string}`;
          toBlock: `0x${string}`;
          topics?: (string | null)[];
        } = {
          address,
          fromBlock: `0x${from.toString(16)}` as `0x${string}`,
          toBlock: `0x${to.toString(16)}` as `0x${string}`,
        };
        // topic0 is always the event signature; indexed filters are appended
        // positionally when callers supply them in `args`.
        params.topics = topics;
        return c.request({
          method: "eth_getLogs",
          params: [params as never],
        }) as Promise<unknown[]>;
      }),
    );

    for (const logs of results) {
      if (!Array.isArray(logs)) continue;
      for (const raw of logs) {
        const log = raw as { data?: string; topics?: string[] };
        try {
          const decoded = decodeEventLog({
            abi,
            eventName,
            data: (log.data ?? "0x") as `0x${string}`,
            topics: (log.topics ?? []) as [
              `0x${string}`,
              ...`0x${string}`[],
            ],
          });
          out.push({
            args: decoded.args as unknown as Record<string, unknown>,
            blockNumber: (raw as { blockNumber?: string }).blockNumber
              ? BigInt((raw as { blockNumber: string }).blockNumber)
              : null,
            transactionHash: (raw as { transactionHash?: string })
              .transactionHash as `0x${string}` | null,
          });
        } catch {
          // Log does not match the requested event signature; skip.
        }
      }
    }
  }

  return out;
}

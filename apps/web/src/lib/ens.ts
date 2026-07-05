/**
 * Server-only ENS reverse-resolution helpers.
 *
 * ENS lives on Ethereum mainnet — none of our user-facing chains
 * (Celo Mainnet, Celo Sepolia) host the registry, so a Celo wagmi
 * client cannot resolve a name. We keep a dedicated viem client
 * pointed at Ethereum mainnet purely for read-only ENS lookups.
 *
 * Result is cached via `unstable_cache` because:
 *   - the ENS records that matter to us (reverse record, primary
 *     name) are written rarely — caching for an hour is a fair
 *     tradeoff for never blocking a page render on a public RPC;
 *   - the landing page resolves 6+ authors per request, so without
 *     the cache we would hammer the same addresses on every
 *     revalidation tick.
 */
import "server-only";

import { unstable_cache } from "next/cache";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

const ENS_RPC =
  process.env.ETHEREUM_RPC_URL ?? "https://ethereum-rpc.publicnode.com";

const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(ENS_RPC),
});

/**
 * Reverse-resolve a 0x address to its primary ENS name. Returns
 * `null` when the address has no reverse record OR the RPC blips —
 * callers should always fall back to a truncated address.
 */
export const resolveEnsName = unstable_cache(
  async (address: `0x${string}`): Promise<string | null> => {
    try {
      const name = await ensClient.getEnsName({ address });
      return name ?? null;
    } catch {
      // Public RPC hiccup — treat as "no ENS" and let the caller
      // fall back to the truncated address.
      return null;
    }
  },
  ["ens-reverse-resolve-v1"],
  { revalidate: 3600, tags: ["ens"] },
);

/**
 * Resolve a batch of addresses in parallel. De-duplicates on input so
 * a feed with five articles from the same author only fires one RPC.
 */
/**
 * @description resolveEnsBatch — core logic for ${NAME}
 * @returns Result of resolveEnsBatch computation
 */
/** resolveEnsBatch - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
export async function resolveEnsBatch(
  addresses: ReadonlyArray<`0x${string}`>,
): Promise<Map<`0x${string}`, string | null>> {
  const unique = [...new Set(addresses)];
  const entries = await Promise.all(
    unique.map(
      async (addr) => [addr, await resolveEnsName(addr)] as const,
    ),
  );
  return new Map(entries);
}

/**
 * Render-time helper: ENS name if known, otherwise the conventional
 * `0x1234…5678` truncation. Pure function, safe to use from a server
 * component or a client component once the lookup result is in hand.
 */
/**
 * @description displayName — core logic for ${NAME}
 * @returns Result of displayName computation
 */
export function displayName(
  address: `0x${string}`,
  ensName: string | null | undefined,
): string {
  if (ensName) return ensName;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
// @type: narrow the generic constraint
// @note: coordinated with PR #87

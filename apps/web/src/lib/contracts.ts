/**
 * Deployed contract addresses per Celo chain.
 *
 * Set via env vars at deploy time so the same code runs against testnet and
 * mainnet without rebuilds.
 */
import { celo, celoSepolia } from "wagmi/chains";
import { tipJarAbi, erc20Abi } from "./abi";

/** Chain IDs used across the app. */
export const SUPPORTED_CHAIN_IDS = [celo.id, celoSepolia.id] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

/** Per-chain on-chain addresses. */
export const ADDRESSES: Record<
  SupportedChainId,
  { tipJar: `0x${string}` | undefined; cUSD: `0x${string}` | undefined }
> = {
  [celo.id]: {
    tipJar: (process.env.NEXT_PUBLIC_TIPJAR_ADDRESS_MAINNET ||
      undefined) as `0x${string}` | undefined,
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  },
  [celoSepolia.id]: {
    tipJar: (process.env.NEXT_PUBLIC_TIPJAR_ADDRESS_SEPOLIA ||
      undefined) as `0x${string}` | undefined,
    cUSD: (process.env.NEXT_PUBLIC_CUSD_ADDRESS_SEPOLIA || undefined) as
      | `0x${string}`
      | undefined,
  },
};

/** Resolve the TipJar address for a given chain — throws on misconfig. */
export function getTipJarAddress(chainId: number): `0x${string}` {
  const cfg = ADDRESSES[chainId as SupportedChainId];
  if (!cfg?.tipJar) {
    throw new Error(`TipJar address not configured for chainId=${chainId}`);
  }
  return cfg.tipJar;
}

/** Resolve cUSD address for a given chain. */
export function getCUSDAddress(chainId: number): `0x${string}` {
  const cfg = ADDRESSES[chainId as SupportedChainId];
  if (!cfg?.cUSD) {
    throw new Error(`cUSD address not configured for chainId=${chainId}`);
  }
  return cfg.cUSD;
}

export { tipJarAbi, erc20Abi };

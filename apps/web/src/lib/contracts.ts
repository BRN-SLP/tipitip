/**
 * Deployed contract addresses per Celo chain.
 *
 * Set via env vars at deploy time so the same code runs against testnet and
 * mainnet without rebuilds.
 */
import { celo, celoSepolia } from "wagmi/chains";
import { tipJarAbi, erc20Abi, supportContractAbi, vaultAbi } from "./abi";

/** Chain IDs used across the app. */
export const SUPPORTED_CHAIN_IDS = [celo.id, celoSepolia.id] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

type Address = `0x${string}` | undefined;

/** Per-chain on-chain addresses. */
export const ADDRESSES: Record<
  SupportedChainId,
  { tipJar: Address; cUSD: Address; support: Address; vault: Address }
> = {
  [celo.id]: {
    tipJar: (process.env.NEXT_PUBLIC_TIPJAR_ADDRESS_MAINNET ||
      undefined) as Address,
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    support: (process.env.NEXT_PUBLIC_SUPPORT_ADDRESS_MAINNET ||
      "0x295aD16766eA47dfe5108f3BF529C9414dEd3008") as Address,
    vault: (process.env.NEXT_PUBLIC_VAULT_ADDRESS_MAINNET ||
      "0xE25B1C521C5B0Df4dD5C9a22986CA95053f5880E") as Address,
  },
  [celoSepolia.id]: {
    tipJar: (process.env.NEXT_PUBLIC_TIPJAR_ADDRESS_SEPOLIA ||
      undefined) as Address,
    cUSD: (process.env.NEXT_PUBLIC_CUSD_ADDRESS_SEPOLIA || undefined) as Address,
    support: (process.env.NEXT_PUBLIC_SUPPORT_ADDRESS_SEPOLIA ||
      undefined) as Address,
    vault: (process.env.NEXT_PUBLIC_VAULT_ADDRESS_SEPOLIA ||
      undefined) as Address,
  },
};

/** Resolve the TipJar address for a given chain. Throws on misconfig. */
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

/** Resolve the TipiTipSupport address for a given chain. */
export function getSupportAddress(chainId: number): `0x${string}` {
  const cfg = ADDRESSES[chainId as SupportedChainId];
  if (!cfg?.support) {
    throw new Error(`Support address not configured for chainId=${chainId}`);
  }
  return cfg.support;
}

/** Resolve the TipiTipVault address for a given chain. */
export function getVaultAddress(chainId: number): `0x${string}` {
  const cfg = ADDRESSES[chainId as SupportedChainId];
  if (!cfg?.vault) {
    throw new Error(`Vault address not configured for chainId=${chainId}`);
  }
  return cfg.vault;
}

export { tipJarAbi, erc20Abi, supportContractAbi, vaultAbi };

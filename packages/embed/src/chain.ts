/**
 * Network constants for the self-contained inline tipping engine.
 *
 * The lite `TipParagraphs` embed talks only to the TipiTip HTTP API and
 * needs none of this. The inline engine signs real transactions from the
 * host page, so it must know the deployed contract addresses and an RPC
 * endpoint without any access to the host's environment variables.
 *
 * Addresses are the canonical TipiTip production deployments. Every value
 * can be overridden per-instance (see `TipEngineConfig`) for staging,
 * forks, or a future redeploy, so hardcoding the defaults here does not
 * lock integrators in.
 */
import type { Hex } from "viem";

export type SupportedChainId = 42220 | 11142220;

export const CELO_MAINNET = 42220 as const;
export const CELO_SEPOLIA = 11142220 as const;

interface ChainConfig {
  tipJar: Hex;
  cUSD: Hex;
  rpcUrl: string;
}

export const CHAIN_CONFIG: Record<SupportedChainId, ChainConfig> = {
  [CELO_MAINNET]: {
    tipJar: "0x73E89882fF0c550111E5b4b5A1967582bddA9cB8",
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    rpcUrl: "https://forno.celo.org",
  },
  [CELO_SEPOLIA]: {
    tipJar: "0xDB11f15D8d6A94AdF63Bd760B1AAE130379983b8",
    cUSD: "0x970746Dc45A60125924e478cC4dDBce54c5F2a68",
    rpcUrl: "https://forno.celo-sepolia.celo-testnet.org",
  },
};

export function isSupportedChainId(id: number): id is SupportedChainId {
  return id === CELO_MAINNET || id === CELO_SEPOLIA;
}

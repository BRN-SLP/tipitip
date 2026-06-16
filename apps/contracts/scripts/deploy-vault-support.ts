/* eslint-disable no-console */
/**
 * Deploy script for TipiTipVault + TipiTipSupport (both non-proxy, immutable).
 *
 * DEPLOY ONLY. This script never calls setTreasury and never moves funds. After
 * it runs and you have verified the addresses on Celoscan, YOU (the TipJar
 * owner) route the fee stream in a separate, deliberate transaction:
 *     TipJar.setTreasury(<vault address>)
 *
 * The deployer becomes the Vault owner (Ownable2Step). Deploy with the wallet
 * you want to own the treasury, ideally the same owner as the TipJar proxy.
 *
 * The Vault takes cUSD and the TipJar proxy and is immutable once set. The
 * Support contract is independent and takes no constructor args.
 *
 * Required env vars:
 *   PRIVATE_KEY     Hex deployer key for the target network.
 *   CUSD_ADDRESS    Fallback only for chains not in KNOWN_CUSD. Mainnet and
 *                   sepolia are known, so the env cannot override them.
 *   TIPJAR_ADDRESS  Fallback only for chains not in KNOWN_TIPJAR.
 *
 * Usage:
 *   pnpm hardhat run scripts/deploy-vault-support.ts --network celo-sepolia
 *   pnpm hardhat run scripts/deploy-vault-support.ts --network celo
 */

import hre from "hardhat";

const KNOWN_CUSD: Record<number, string> = {
  // Celo Mainnet
  42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  // Celo Sepolia
  11142220: "0x970746Dc45A60125924e478cC4dDBce54c5F2a68",
};

const KNOWN_TIPJAR: Record<number, string> = {
  // Celo Mainnet TipJar UUPS proxy
  42220: "0x73E89882fF0c550111E5b4b5A1967582bddA9cB8",
  // Celo Sepolia TipJar UUPS proxy
  11142220: "0xDB11f15D8d6A94AdF63Bd760B1AAE130379983b8",
};

async function main() {
  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  // Known chains are authoritative, so a stale CUSD_ADDRESS or TIPJAR_ADDRESS
  // left in a testnet .env can never override the canonical mainnet addresses.
  // The env is only a fallback for chains not listed in the KNOWN maps.
  const cUSD = KNOWN_CUSD[chainId] || process.env.CUSD_ADDRESS?.trim() || "";
  const tipJar =
    KNOWN_TIPJAR[chainId] || process.env.TIPJAR_ADDRESS?.trim() || "";
  if (!cUSD) {
    throw new Error(
      `No cUSD address for chainId=${chainId}. Set CUSD_ADDRESS or extend KNOWN_CUSD.`,
    );
  }
  if (!tipJar) {
    throw new Error(
      `No TipJar address for chainId=${chainId}. Set TIPJAR_ADDRESS or extend KNOWN_TIPJAR.`,
    );
  }

  console.log(
    `\nDeploying TipiTipVault + TipiTipSupport on network=${network.name} chainId=${chainId}`,
  );
  console.log(`  deployer = ${deployer.address}  (becomes the vault owner)`);
  console.log(`  cUSD     = ${cUSD}`);
  console.log(`  tipJar   = ${tipJar}\n`);

  const Vault = await ethers.getContractFactory("TipiTipVault");
  const vault = await Vault.deploy(cUSD, tipJar);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`✓ TipiTipVault:   ${vaultAddress}`);

  const Support = await ethers.getContractFactory("TipiTipSupport");
  const support = await Support.deploy();
  await support.waitForDeployment();
  const supportAddress = await support.getAddress();
  console.log(`✓ TipiTipSupport: ${supportAddress}\n`);

  console.log("Verify on Celoscan (constructor args included):");
  console.log(
    `  pnpm hardhat verify --network ${network.name} ${vaultAddress} ${cUSD} ${tipJar}`,
  );
  console.log(
    `  pnpm hardhat verify --network ${network.name} ${supportAddress}\n`,
  );

  console.log("Then, as the TipJar owner, route the protocol fee to the vault:");
  console.log(`  TipJar(${tipJar}).setTreasury(${vaultAddress})`);
  console.log(
    "  Deliberate, separate tx. Fees already accrued to the old treasury\n" +
      "  stay claimable by it, so claim those first if you want a clean cut.\n",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

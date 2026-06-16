/* eslint-disable no-console */
/**
 * Point the TipJar protocol fee at the TipiTipVault by calling
 * TipJar.setTreasury(vault). Owner-only on TipJar, so run it from the TipJar
 * owner wallet.
 *
 * This redirects the LIVE 2.5% fee stream to the vault. It is reversible (run
 * again pointing at the old treasury). Fees already accrued to the old treasury
 * stay claimable by it.
 *
 * Usage:
 *   pnpm hardhat run scripts/set-treasury.ts --network celo
 */

import hre from "hardhat";

const KNOWN_TIPJAR: Record<number, string> = {
  42220: "0x73E89882fF0c550111E5b4b5A1967582bddA9cB8",
  11142220: "0xDB11f15D8d6A94AdF63Bd760B1AAE130379983b8",
};

const KNOWN_VAULT: Record<number, string> = {
  // Celo Mainnet TipiTipVault
  42220: "0xE25B1C521C5B0Df4dD5C9a22986CA95053f5880E",
};

const TIPJAR_ABI = [
  "function owner() view returns (address)",
  "function treasury() view returns (address)",
  "function setTreasury(address newTreasury) external",
];

async function main() {
  const { ethers, network } = hre;
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const tipJar = KNOWN_TIPJAR[chainId] || process.env.TIPJAR_ADDRESS?.trim();
  const vault = KNOWN_VAULT[chainId] || process.env.VAULT_ADDRESS?.trim();
  if (!tipJar) throw new Error(`No TipJar for chainId=${chainId}.`);
  if (!vault) {
    throw new Error(`No vault for chainId=${chainId}. Set VAULT_ADDRESS.`);
  }

  const [signer] = await ethers.getSigners();
  const jar = new ethers.Contract(tipJar, TIPJAR_ABI, signer);
  const owner: string = await jar.owner();
  const before: string = await jar.treasury();

  console.log(`network=${network.name} chainId=${chainId}`);
  console.log(`  signer            = ${signer.address}`);
  console.log(`  tipJar owner      = ${owner}`);
  console.log(`  treasury (before) = ${before}`);
  console.log(`  vault (target)    = ${vault}`);

  if (signer.address.toLowerCase() !== owner.toLowerCase()) {
    throw new Error("Signer is not the TipJar owner; setTreasury would revert.");
  }
  if (before.toLowerCase() === vault.toLowerCase()) {
    console.log("Treasury already points at the vault. Nothing to do.");
    return;
  }

  const tx = await jar.setTreasury(vault);
  console.log(`  setTreasury tx    = ${tx.hash}`);
  await tx.wait();
  const after: string = await jar.treasury();
  console.log(`  treasury (after)  = ${after}`);
  console.log("Done. The 2.5% fee now accrues to the vault; pull it with sweepFees().");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

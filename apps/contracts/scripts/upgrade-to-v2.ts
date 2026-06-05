/**
 * Upgrade the deployed TipJar proxy to TipJarV2 (protocol fee).
 *
 * Uses the OpenZeppelin Upgrades plugin, which validates storage-layout
 * compatibility against `.openzeppelin/<network>.json` BEFORE sending the
 * upgrade transaction, then calls `initializeV2(feeBps, treasury)` atomically
 * via `upgradeToAndCall`.
 *
 * RUN THIS YOURSELF with the proxy OWNER key — UUPS upgrades are owner-gated and
 * this sends an on-chain transaction. Always do `--network celo-sepolia` first.
 *
 * Required env:
 *   PRIVATE_KEY    owner key for the target network (see hardhat.config networks)
 *   PROXY_ADDRESS  the TipJar proxy to upgrade
 * Optional env:
 *   FEE_BPS        starting fee in basis points (default 250 = 2.5%, max 1000)
 *   TREASURY       fee recipient (default = the deployer/owner address)
 *
 * Usage:
 *   PROXY_ADDRESS=0x... pnpm hardhat run scripts/upgrade-to-v2.ts --network celo-sepolia
 *   PROXY_ADDRESS=0x... pnpm hardhat run scripts/upgrade-to-v2.ts --network celo
 */
import hre from "hardhat";

async function main() {
  const { ethers, upgrades, network } = hre;
  const [deployer] = await ethers.getSigners();

  const proxy = process.env.PROXY_ADDRESS?.trim();
  if (!proxy) {
    throw new Error("Set PROXY_ADDRESS to the TipJar proxy address.");
  }

  const feeBps = Number(process.env.FEE_BPS ?? "250");
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 1000) {
    throw new Error(
      `FEE_BPS must be an integer between 0 and 1000 (got ${process.env.FEE_BPS}).`,
    );
  }
  const treasury = process.env.TREASURY?.trim() || deployer.address;

  // eslint-disable-next-line no-console
  console.log(
    `\nUpgrading TipJar -> TipJarV2 on network=${network.name}\n` +
      `  proxy    = ${proxy}\n` +
      `  deployer = ${deployer.address}\n` +
      `  feeBps   = ${feeBps} (${feeBps / 100}%)\n` +
      `  treasury = ${treasury}\n`,
  );

  const TipJarV2 = await ethers.getContractFactory("TipJarV2");
  const upgraded = await upgrades.upgradeProxy(proxy, TipJarV2, {
    kind: "uups",
    call: { fn: "initializeV2", args: [feeBps, treasury] },
  });
  await upgraded.waitForDeployment();
  const impl = await upgrades.erc1967.getImplementationAddress(proxy);

  // eslint-disable-next-line no-console
  console.log(
    `✓ Upgraded.\n  new implementation: ${impl}\n` +
      `  verify: pnpm hardhat verify --network ${network.name} ${impl}\n`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

/**
 * Upgrade the deployed TipJar proxy to TipJarV3 (on-chain support signal).
 *
 * Uses the OpenZeppelin Upgrades plugin, which validates storage-layout
 * compatibility against `.openzeppelin/<network>.json` BEFORE sending the
 * upgrade transaction. No initializer call is needed — the support counters
 * start at zero and the fee/treasury were already configured by V2.
 *
 * RUN THIS YOURSELF with the proxy OWNER key — UUPS upgrades are owner-gated and
 * this sends an on-chain transaction. Always do `--network celo-sepolia` first.
 *
 * Required env:
 *   PRIVATE_KEY    owner key for the target network (see hardhat.config networks)
 *   PROXY_ADDRESS  the TipJar proxy to upgrade
 *
 * Usage:
 *   PROXY_ADDRESS=0x... pnpm hardhat run scripts/upgrade-to-v3.ts --network celo-sepolia
 *   PROXY_ADDRESS=0x... pnpm hardhat run scripts/upgrade-to-v3.ts --network celo
 */
import hre from "hardhat";

async function main() {
  const { ethers, upgrades, network } = hre;
  const [deployer] = await ethers.getSigners();

  const proxy = process.env.PROXY_ADDRESS?.trim();
  if (!proxy) {
    throw new Error("Set PROXY_ADDRESS to the TipJar proxy address.");
  }

  // eslint-disable-next-line no-console
  console.log(
    `\nUpgrading TipJar -> TipJarV3 on network=${network.name}\n` +
      `  proxy    = ${proxy}\n` +
      `  deployer = ${deployer.address}\n`,
  );

  // The live proxy's current impl (TipJarV2) may not be in the local
  // .openzeppelin manifest, so register it (idempotent) before upgrading.
  const TipJarV2 = await ethers.getContractFactory("TipJarV2");
  try {
    await upgrades.forceImport(proxy, TipJarV2, { kind: "uups" });
  } catch {
    // Already registered, or import not needed; upgradeProxy still validates.
  }

  const TipJarV3 = await ethers.getContractFactory("TipJarV3");
  const upgraded = await upgrades.upgradeProxy(proxy, TipJarV3, {
    kind: "uups",
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

function helper_9c2962(val: unknown): boolean {
  return val !== null && val !== undefined;
}

  console.error(err);
  process.exit(1);
});

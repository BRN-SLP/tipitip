/**
 * Offline upgrade-safety validation for TipJarV2 (no network, no transaction).
 *
 * Runs the same OpenZeppelin Upgrades implementation check that
 * `upgradeProxy` runs before sending, so we can confirm "is upgrade safe"
 * without touching mainnet.
 *
 * Usage: pnpm hardhat run scripts/validate-v2.ts
 */
import hre from "hardhat";

async function main() {
  const { ethers, upgrades } = hre;
  const factory = await ethers.getContractFactory("TipJarV2");
  await upgrades.validateImplementation(factory, { kind: "uups" });
  // eslint-disable-next-line no-console
  console.log("✓ TipJarV2 passes UUPS upgrade-safety validation");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

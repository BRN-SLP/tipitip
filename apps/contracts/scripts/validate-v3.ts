/**
 * Offline upgrade-safety validation for TipJarV3 (no network, no transaction).
 *
 * Runs the OpenZeppelin Upgrades checks that `upgradeProxy` runs before
 * sending: the standalone implementation check, plus a storage-layout diff of
 * V2 -> V3 to confirm the append-only support fields don't collide with any
 * existing slot. Lets us confirm "is the upgrade safe" without touching mainnet.
 *
 * Usage: pnpm hardhat run scripts/validate-v3.ts
 */
import hre from "hardhat";

async function main() {
  const { ethers, upgrades } = hre;
  const v2 = await ethers.getContractFactory("TipJarV2");
  const v3 = await ethers.getContractFactory("TipJarV3");

  await upgrades.validateImplementation(v3, { kind: "uups" });
  await upgrades.validateUpgrade(v2, v3, { kind: "uups" });

  // eslint-disable-next-line no-console
  console.log(
    "✓ TipJarV3 passes UUPS upgrade-safety validation (V2 -> V3 storage compatible)",
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

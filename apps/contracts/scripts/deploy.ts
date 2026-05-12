/**
 * UUPS proxy deploy script for the TipJar contract.
 *
 * Uses the OpenZeppelin Hardhat Upgrades plugin so that subsequent upgrades
 * are tracked under `.openzeppelin/<network>.json` and storage layout
 * compatibility is verified automatically.
 *
 * Required env vars:
 *   PRIVATE_KEY        Hex deployer key for the target network (use a fresh
 *                      key dedicated to deploys — never your personal wallet).
 *   CUSD_ADDRESS       ERC-20 address used for tips on the target network.
 *                      Mainnet default kicks in only when --network celo.
 *
 * Usage:
 *   pnpm hardhat run scripts/deploy.ts --network celo-sepolia
 *   pnpm hardhat run scripts/deploy.ts --network celo
 */

import hre from "hardhat";

const KNOWN_CUSD: Record<number, string> = {
  // Celo Mainnet
  42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  // Celo Sepolia — set via CUSD_ADDRESS env if/when published.
};

async function main() {
  const { ethers, upgrades, network } = hre;
  const [deployer] = await ethers.getSigners();
  const chainId = Number((await ethers.provider.getNetwork()).chainId);

  const cUSD =
    process.env.CUSD_ADDRESS?.trim() || KNOWN_CUSD[chainId] || "";
  if (!cUSD) {
    throw new Error(
      `No cUSD address configured for chainId=${chainId}. Set CUSD_ADDRESS env or extend KNOWN_CUSD.`,
    );
  }

  // eslint-disable-next-line no-console
  console.log(
    `\nDeploying TipJar proxy on network=${network.name} chainId=${chainId}`,
  );
  // eslint-disable-next-line no-console
  console.log(`  deployer = ${deployer.address}`);
  // eslint-disable-next-line no-console
  console.log(`  cUSD     = ${cUSD}\n`);

  const TipJar = await ethers.getContractFactory("TipJar");
  const proxy = await upgrades.deployProxy(TipJar, [deployer.address, cUSD], {
    kind: "uups",
    initializer: "initialize",
  });
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress,
  );

  // eslint-disable-next-line no-console
  console.log(`✓ Proxy:          ${proxyAddress}`);
  // eslint-disable-next-line no-console
  console.log(`✓ Implementation: ${implAddress}`);
  // eslint-disable-next-line no-console
  console.log(
    `\nNext: pnpm hardhat verify --network ${network.name} ${implAddress}\n`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

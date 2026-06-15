import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import {
  encodeFunctionData,
  keccak256,
  parseUnits,
  stringToHex,
  toHex,
} from "viem";

const HUNDRED = parseUnits("100", 18);
const TEN = parseUnits("10", 18);
const FEE_BPS = 250;
const DUMMY_TIPJAR = "0x000000000000000000000000000000000000dEaD" as const;

async function expectRevert(p: Promise<unknown>): Promise<void> {
  let threw = false;
  try {
    await p;
  } catch {
    threw = true;
  }
  expect(threw, "expected the call to revert").to.equal(true);
}

function articleId(author: `0x${string}`, slug: string): `0x${string}` {
  const slugHex = stringToHex(slug).slice(2);
  return keccak256(`0x${author.slice(2)}${slugHex}` as `0x${string}`);
}

function paragraphKey(
  artId: `0x${string}`,
  index: number,
  text: string,
): `0x${string}` {
  const idxHex = toHex(index, { size: 4 }).slice(2);
  const textHash = keccak256(stringToHex(text)).slice(2);
  return keccak256(`0x${artId.slice(2)}${idxHex}${textHash}` as `0x${string}`);
}

async function deployVault() {
  const [owner, alice, bob] = await hre.viem.getWalletClients();
  const cusd = await hre.viem.deployContract("MockCUSD", []);
  const vault = await hre.viem.deployContract("TipiTipVault", [
    cusd.address,
    DUMMY_TIPJAR,
  ]);
  for (const w of [alice, bob]) {
    await cusd.write.mint([w.account.address, HUNDRED]);
    const cusdAs = await hre.viem.getContractAt("MockCUSD", cusd.address, {
      client: { wallet: w },
    });
    await cusdAs.write.approve([vault.address, HUNDRED]);
  }
  const vaultAs = (w: (typeof alice)) =>
    hre.viem.getContractAt("TipiTipVault", vault.address, {
      client: { wallet: w },
    });
  return { owner, alice, bob, cusd, vault, vaultAs };
}

async function deployVaultWithTipJar() {
  const [owner, alice] = await hre.viem.getWalletClients();
  const cusd = await hre.viem.deployContract("MockCUSD", []);
  const v1 = await hre.viem.deployContract("TipJar", []);
  const proxy = await hre.viem.deployContract("ERC1967Proxy", [
    v1.address,
    encodeFunctionData({
      abi: v1.abi,
      functionName: "initialize",
      args: [owner.account.address, cusd.address],
    }),
  ]);
  const v2 = await hre.viem.deployContract("TipJarV2", []);
  const ownerV1 = await hre.viem.getContractAt("TipJar", proxy.address, {
    client: { wallet: owner },
  });
  await ownerV1.write.upgradeToAndCall([
    v2.address,
    encodeFunctionData({
      abi: v2.abi,
      functionName: "initializeV2",
      args: [FEE_BPS, owner.account.address],
    }),
  ]);
  const v3 = await hre.viem.deployContract("TipJarV3", []);
  const ownerV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
    client: { wallet: owner },
  });
  await ownerV2.write.upgradeToAndCall([v3.address, "0x"]);

  const vault = await hre.viem.deployContract("TipiTipVault", [
    cusd.address,
    proxy.address,
  ]);
  const tipJarOwner = await hre.viem.getContractAt("TipJarV3", proxy.address, {
    client: { wallet: owner },
  });
  await tipJarOwner.write.setTreasury([vault.address]);

  await cusd.write.mint([alice.account.address, HUNDRED]);
  const cusdAlice = await hre.viem.getContractAt("MockCUSD", cusd.address, {
    client: { wallet: alice },
  });
  await cusdAlice.write.approve([proxy.address, HUNDRED]);

  const tipJar = await hre.viem.getContractAt("TipJarV3", proxy.address);
  return { owner, alice, cusd, vault, tipJar };
}

describe("TipiTipVault", () => {
  describe("donate", () => {
    it("pulls cUSD from the donor into the vault", async () => {
      const { alice, cusd, vault, vaultAs } = await loadFixture(deployVault);
      await (await vaultAs(alice)).write.donate([TEN]);
      expect(await cusd.read.balanceOf([vault.address])).to.equal(TEN);
    });

    it("reverts on a zero donation", async () => {
      const { alice, vaultAs } = await loadFixture(deployVault);
      await expectRevert((await vaultAs(alice)).write.donate([0n]));
    });
  });

  describe("allocate and claim", () => {
    it("lets the owner allocate and the recipient claim", async () => {
      const { owner, alice, bob, cusd, vault, vaultAs } =
        await loadFixture(deployVault);
      await (await vaultAs(alice)).write.donate([TEN]);
      const four = parseUnits("4", 18);
      await (await vaultAs(owner)).write.allocate([bob.account.address, four]);
      expect(await vault.read.totalAllocated()).to.equal(four);
      const before = await cusd.read.balanceOf([bob.account.address]);
      await (await vaultAs(bob)).write.claim();
      expect(await cusd.read.balanceOf([bob.account.address])).to.equal(
        before + four,
      );
      expect(await vault.read.totalAllocated()).to.equal(0n);
    });

    it("rejects an allocation beyond the un-allocated balance", async () => {
      const { owner, alice, bob, vaultAs } = await loadFixture(deployVault);
      await (await vaultAs(alice)).write.donate([TEN]);
      await expectRevert(
        (await vaultAs(owner)).write.allocate([
          bob.account.address,
          parseUnits("11", 18),
        ]),
      );
    });

    it("only the owner can allocate", async () => {
      const { alice, bob, vaultAs } = await loadFixture(deployVault);
      await (await vaultAs(alice)).write.donate([TEN]);
      await expectRevert(
        (await vaultAs(alice)).write.allocate([bob.account.address, TEN]),
      );
    });

    it("reverts a claim when nothing is allocated", async () => {
      const { bob, vaultAs } = await loadFixture(deployVault);
      await expectRevert((await vaultAs(bob)).write.claim());
    });
  });

  describe("withdraw", () => {
    it("lets the owner withdraw un-allocated funds", async () => {
      const { owner, alice, cusd, vaultAs } = await loadFixture(deployVault);
      await (await vaultAs(alice)).write.donate([TEN]);
      const three = parseUnits("3", 18);
      const before = await cusd.read.balanceOf([owner.account.address]);
      await (await vaultAs(owner)).write.withdraw([owner.account.address, three]);
      expect(await cusd.read.balanceOf([owner.account.address])).to.equal(
        before + three,
      );
    });

    it("cannot touch funds reserved for claimers", async () => {
      const { owner, alice, bob, vaultAs } = await loadFixture(deployVault);
      await (await vaultAs(alice)).write.donate([TEN]);
      await (await vaultAs(owner)).write.allocate([
        bob.account.address,
        parseUnits("8", 18),
      ]);
      await expectRevert(
        (await vaultAs(owner)).write.withdraw([
          owner.account.address,
          parseUnits("3", 18),
        ]),
      );
      await (await vaultAs(owner)).write.withdraw([
        owner.account.address,
        parseUnits("2", 18),
      ]);
    });

    it("only the owner can withdraw", async () => {
      const { alice, vaultAs } = await loadFixture(deployVault);
      await (await vaultAs(alice)).write.donate([TEN]);
      await expectRevert(
        (await vaultAs(alice)).write.withdraw([alice.account.address, TEN]),
      );
    });
  });

  describe("sweepFees", () => {
    it("sweeps the TipJar protocol fee into the vault", async () => {
      const { alice, cusd, vault, tipJar } =
        await loadFixture(deployVaultWithTipJar);
      const id = articleId(alice.account.address, "hello");
      const tipJarAlice = await hre.viem.getContractAt(
        "TipJarV3",
        tipJar.address,
        { client: { wallet: alice } },
      );
      await tipJarAlice.write.registerArticle([
        id,
        keccak256(stringToHex("body")),
        "hello",
      ]);
      await tipJarAlice.write.tipParagraph([
        id,
        paragraphKey(id, 0, "p"),
        HUNDRED,
      ]);
      const fee = parseUnits("2.5", 18);
      expect(await tipJar.read.pendingOf([vault.address])).to.equal(fee);

      await vault.write.sweepFees();
      expect(await cusd.read.balanceOf([vault.address])).to.equal(fee);
      expect(await tipJar.read.pendingOf([vault.address])).to.equal(0n);
    });
  });
});

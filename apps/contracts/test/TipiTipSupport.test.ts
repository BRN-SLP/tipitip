import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { parseUnits } from "viem";

const HUNDRED = parseUnits("100", 18);
const FIVE = parseUnits("5", 18);

async function expectRevert(p: Promise<unknown>): Promise<void> {
  let threw = false;
  try {
    await p;
  } catch {
    threw = true;
  }
  expect(threw, "expected the call to revert").to.equal(true);
}

async function deploySupport() {
  // `vaultSink` stands in for the vault: supportWithDonation just transfers the
  // cUSD straight to that address, so a plain wallet is enough to assert it.
  const [owner, alice, bob, vaultSink] = await hre.viem.getWalletClients();
  const cusd = await hre.viem.deployContract("MockCUSD", []);
  const support = await hre.viem.deployContract("TipiTipSupport", [
    cusd.address,
    vaultSink.account.address,
  ]);
  for (const w of [alice, bob]) {
    await cusd.write.mint([w.account.address, HUNDRED]);
    const cusdAs = await hre.viem.getContractAt("MockCUSD", cusd.address, {
      client: { wallet: w },
    });
    await cusdAs.write.approve([support.address, HUNDRED]);
  }
  const supportAs = (w: (typeof alice)) =>
    hre.viem.getContractAt("TipiTipSupport", support.address, {
      client: { wallet: w },
    });
  return { owner, alice, bob, vaultSink, cusd, support, supportAs };
}

describe("TipiTipSupport", () => {
  it("counts a first-time supporter once", async () => {
    const { alice, support, supportAs } = await loadFixture(deploySupport);
    await (await supportAs(alice)).write.support([""]);
    expect(await support.read.supportCount()).to.equal(1n);
    expect(await support.read.uniqueSupporters()).to.equal(1n);
    expect(await support.read.hasSupported([alice.account.address])).to.equal(
      true,
    );
  });

  it("bumps supportCount but not uniqueSupporters on a repeat", async () => {
    const { alice, supportAs, support } = await loadFixture(deploySupport);
    const sa = await supportAs(alice);
    await sa.write.support([""]);
    await sa.write.support(["again"]);
    expect(await support.read.supportCount()).to.equal(2n);
    expect(await support.read.uniqueSupporters()).to.equal(1n);
  });

  it("counts distinct supporters separately", async () => {
    const { alice, bob, support, supportAs } = await loadFixture(deploySupport);
    await (await supportAs(alice)).write.support([""]);
    await (await supportAs(bob)).write.support([""]);
    expect(await support.read.uniqueSupporters()).to.equal(2n);
  });

  it("rejects an over-long message", async () => {
    const { alice, supportAs } = await loadFixture(deploySupport);
    const tooLong = "x".repeat(281);
    await expectRevert((await supportAs(alice)).write.support([tooLong]));
  });

  it("forwards a donation straight to the vault and still records support", async () => {
    const { alice, vaultSink, cusd, support, supportAs } =
      await loadFixture(deploySupport);
    const before = await cusd.read.balanceOf([vaultSink.account.address]);
    await (await supportAs(alice)).write.supportWithDonation(["thanks", FIVE]);
    expect(await cusd.read.balanceOf([vaultSink.account.address])).to.equal(
      before + FIVE,
    );
    // the support contract never holds funds
    expect(await cusd.read.balanceOf([support.address])).to.equal(0n);
    expect(await support.read.supportCount()).to.equal(1n);
  });

  it("treats a zero-amount donation like a plain support", async () => {
    const { alice, vaultSink, cusd, support, supportAs } =
      await loadFixture(deploySupport);
    const before = await cusd.read.balanceOf([vaultSink.account.address]);
    await (await supportAs(alice)).write.supportWithDonation(["", 0n]);
    expect(await cusd.read.balanceOf([vaultSink.account.address])).to.equal(
      before,
    );
    expect(await support.read.supportCount()).to.equal(1n);
  });
});

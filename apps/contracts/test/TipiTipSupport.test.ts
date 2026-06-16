import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

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
  const [owner, alice, bob] = await hre.viem.getWalletClients();
  const support = await hre.viem.deployContract("TipiTipSupport", []);
  const supportAs = (w: (typeof alice)) =>
    hre.viem.getContractAt("TipiTipSupport", support.address, {
      client: { wallet: w },
    });
  return { owner, alice, bob, support, supportAs };
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
});

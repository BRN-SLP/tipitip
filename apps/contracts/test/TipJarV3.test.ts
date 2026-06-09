import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import {
  encodeFunctionData,
  getAddress,
  keccak256,
  parseUnits,
  stringToHex,
  toHex,
} from "viem";

const ONE = parseUnits("1", 18);
const HUNDRED = parseUnits("100", 18);
const FEE_BPS = 250; // 2.5%

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

/** Deploy V1 proxy, fund/approve wallets, upgrade V1 -> V2 (fee on, treasury =
 *  owner), then upgrade V2 -> V3 (support). The V3 upgrade carries no
 *  initializer (support counters start at zero). */
async function deployV3() {
  const [owner, alice, bob, carol] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const cUSD = await hre.viem.deployContract("MockCUSD", []);
  const v1Impl = await hre.viem.deployContract("TipJar", []);
  const initData = encodeFunctionData({
    abi: v1Impl.abi,
    functionName: "initialize",
    args: [owner.account.address, cUSD.address],
  });
  const proxy = await hre.viem.deployContract("ERC1967Proxy", [
    v1Impl.address,
    initData,
  ]);

  for (const w of [alice, bob, carol]) {
    await cUSD.write.mint([w.account.address, HUNDRED]);
    const cusdAs = await hre.viem.getContractAt("MockCUSD", cUSD.address, {
      client: { wallet: w },
    });
    await cusdAs.write.approve([proxy.address, HUNDRED]);
  }

  // V1 -> V2 (fee).
  const v2Impl = await hre.viem.deployContract("TipJarV2", []);
  const initV2 = encodeFunctionData({
    abi: v2Impl.abi,
    functionName: "initializeV2",
    args: [FEE_BPS, owner.account.address],
  });
  const ownerV1 = await hre.viem.getContractAt("TipJar", proxy.address, {
    client: { wallet: owner },
  });
  await ownerV1.write.upgradeToAndCall([v2Impl.address, initV2]);

  // V2 -> V3 (support). No initializer call.
  const v3Impl = await hre.viem.deployContract("TipJarV3", []);
  const ownerV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
    client: { wallet: owner },
  });
  await ownerV2.write.upgradeToAndCall([v3Impl.address, "0x"]);

  const v3 = await hre.viem.getContractAt("TipJarV3", proxy.address);
  return { owner, alice, bob, carol, publicClient, cUSD, v3, proxy };
}

async function registerBy(
  proxyAddr: `0x${string}`,
  wallet: Awaited<ReturnType<typeof hre.viem.getWalletClients>>[number],
  slug: string,
): Promise<`0x${string}`> {
  const id = articleId(wallet.account.address, slug);
  const as = await hre.viem.getContractAt("TipJarV3", proxyAddr, {
    client: { wallet },
  });
  await as.write.registerArticle([id, keccak256(stringToHex(slug)), slug]);
  return id;
}

async function supportAs(
  proxyAddr: `0x${string}`,
  wallet: Awaited<ReturnType<typeof hre.viem.getWalletClients>>[number],
  message: string,
) {
  const as = await hre.viem.getContractAt("TipJarV3", proxyAddr, {
    client: { wallet },
  });
  return as.write.support([message]);
}

describe("TipJarV3 (on-chain support)", function () {
  it("preserves V1+V2 state through the V3 upgrade", async function () {
    const [owner, alice, bob] = await hre.viem.getWalletClients();
    const cUSD = await hre.viem.deployContract("MockCUSD", []);
    const v1Impl = await hre.viem.deployContract("TipJar", []);
    const initData = encodeFunctionData({
      abi: v1Impl.abi,
      functionName: "initialize",
      args: [owner.account.address, cUSD.address],
    });
    const proxy = await hre.viem.deployContract("ERC1967Proxy", [
      v1Impl.address,
      initData,
    ]);
    await cUSD.write.mint([bob.account.address, HUNDRED]);
    const cusdBob = await hre.viem.getContractAt("MockCUSD", cUSD.address, {
      client: { wallet: bob },
    });
    await cusdBob.write.approve([proxy.address, HUNDRED]);

    // V1: register + tip.
    const id = articleId(alice.account.address, "pre");
    const v1Alice = await hre.viem.getContractAt("TipJar", proxy.address, {
      client: { wallet: alice },
    });
    await v1Alice.write.registerArticle([id, keccak256(stringToHex("x")), "pre"]);
    const v1Bob = await hre.viem.getContractAt("TipJar", proxy.address, {
      client: { wallet: bob },
    });
    await v1Bob.write.tipParagraph([id, paragraphKey(id, 0, "p"), ONE]);

    // V1 -> V2.
    const v2Impl = await hre.viem.deployContract("TipJarV2", []);
    const initV2 = encodeFunctionData({
      abi: v2Impl.abi,
      functionName: "initializeV2",
      args: [FEE_BPS, owner.account.address],
    });
    const ownerV1 = await hre.viem.getContractAt("TipJar", proxy.address, {
      client: { wallet: owner },
    });
    await ownerV1.write.upgradeToAndCall([v2Impl.address, initV2]);

    // V2 -> V3.
    const v3Impl = await hre.viem.deployContract("TipJarV3", []);
    const ownerV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: owner },
    });
    await ownerV2.write.upgradeToAndCall([v3Impl.address, "0x"]);
    const v3 = await hre.viem.getContractAt("TipJarV3", proxy.address);

    // V1 + V2 state intact.
    expect(getAddress(await v3.read.articleAuthor([id]))).to.equal(
      getAddress(alice.account.address),
    );
    expect(await v3.read.pendingOf([alice.account.address])).to.equal(ONE);
    expect(await v3.read.feeBps()).to.equal(FEE_BPS);
    expect(getAddress(await v3.read.treasury())).to.equal(
      getAddress(owner.account.address),
    );
    // New V3 counters start clean.
    expect(await v3.read.supportCount()).to.equal(0n);
    expect(await v3.read.uniqueSupporters()).to.equal(0n);
  });

  it("still tips with the V2 fee after the V3 upgrade", async function () {
    const { owner, alice, bob, cUSD, v3, proxy } =
      await loadFixture(deployV3);
    const id = await registerBy(proxy.address, alice, "post");

    const bobV3 = await hre.viem.getContractAt("TipJarV3", proxy.address, {
      client: { wallet: bob },
    });
    await bobV3.write.tipParagraph([id, paragraphKey(id, 0, "p"), HUNDRED]);

    const fee = (HUNDRED * BigInt(FEE_BPS)) / 10_000n;
    expect(await v3.read.pendingOf([alice.account.address])).to.equal(
      HUNDRED - fee,
    );
    expect(await v3.read.pendingOf([owner.account.address])).to.equal(fee);
    expect(await cUSD.read.balanceOf([proxy.address])).to.equal(HUNDRED);
  });

  it("records support with a message and counts the wallet once", async function () {
    const { alice, v3, proxy } = await loadFixture(deployV3);
    await supportAs(proxy.address, alice, "love this");

    expect(await v3.read.supportCount()).to.equal(1n);
    expect(await v3.read.uniqueSupporters()).to.equal(1n);
    expect(await v3.read.hasSupported([alice.account.address])).to.equal(true);

    const events = await v3.getEvents.Supported();
    const last = events[events.length - 1];
    expect(getAddress(last.args.supporter as `0x${string}`)).to.equal(
      getAddress(alice.account.address),
    );
    expect(last.args.message).to.equal("love this");
    expect((last.args.at as bigint) > 0n).to.equal(true);
  });

  it("counts repeat support from the same wallet once in uniqueSupporters", async function () {
    const { alice, v3, proxy } = await loadFixture(deployV3);
    await supportAs(proxy.address, alice, "");
    await supportAs(proxy.address, alice, "again");

    expect(await v3.read.supportCount()).to.equal(2n);
    expect(await v3.read.uniqueSupporters()).to.equal(1n);
  });

  it("tracks distinct supporters", async function () {
    const { alice, bob, carol, v3, proxy } = await loadFixture(deployV3);
    await supportAs(proxy.address, alice, "");
    await supportAs(proxy.address, bob, "");
    await supportAs(proxy.address, carol, "");

    expect(await v3.read.supportCount()).to.equal(3n);
    expect(await v3.read.uniqueSupporters()).to.equal(3n);
  });

  it("allows an empty message and rejects an over-long one", async function () {
    const { alice, bob, proxy } = await loadFixture(deployV3);
    // Empty is fine.
    await supportAs(proxy.address, alice, "");
    // 281 bytes > MAX_SUPPORT_MESSAGE_BYTES (280) reverts.
    await expect(
      supportAs(proxy.address, bob, "a".repeat(281)),
    ).to.be.rejected;
  });
});

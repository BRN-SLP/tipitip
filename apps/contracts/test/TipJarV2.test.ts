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
  zeroAddress,
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

/** Deploy V1 proxy, fund/approve wallets, then upgrade to TipJarV2 with the fee
 *  configured (treasury = owner). No tips happen before the upgrade so balances
 *  start clean for the fee-math assertions. */
async function deployUpgraded() {
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

  const v2 = await hre.viem.getContractAt("TipJarV2", proxy.address);
  return { owner, alice, bob, carol, publicClient, cUSD, v2, proxy };
}

async function registerBy(
  proxyAddr: `0x${string}`,
  wallet: Awaited<ReturnType<typeof hre.viem.getWalletClients>>[number],
  slug: string,
): Promise<`0x${string}`> {
  const id = articleId(wallet.account.address, slug);
  const as = await hre.viem.getContractAt("TipJarV2", proxyAddr, {
    client: { wallet },
  });
  await as.write.registerArticle([id, keccak256(stringToHex(slug)), slug]);
  return id;
}

describe("TipJarV2 (protocol fee)", function () {
  it("preserves V1 state through the upgrade and sets fee + treasury", async function () {
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

    // V1: register + tip (no fee in V1).
    const id = articleId(alice.account.address, "pre");
    const v1Alice = await hre.viem.getContractAt("TipJar", proxy.address, {
      client: { wallet: alice },
    });
    await v1Alice.write.registerArticle([id, keccak256(stringToHex("x")), "pre"]);
    const v1Bob = await hre.viem.getContractAt("TipJar", proxy.address, {
      client: { wallet: bob },
    });
    await v1Bob.write.tipParagraph([id, paragraphKey(id, 0, "p"), ONE]);

    // Upgrade.
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
    const v2 = await hre.viem.getContractAt("TipJarV2", proxy.address);

    expect(getAddress(await v2.read.articleAuthor([id]))).to.equal(
      getAddress(alice.account.address),
    );
    expect(await v2.read.pendingOf([alice.account.address])).to.equal(ONE);
    expect(await v2.read.feeBps()).to.equal(FEE_BPS);
    expect(getAddress(await v2.read.treasury())).to.equal(
      getAddress(owner.account.address),
    );
  });

  it("deducts the fee on tip: author gets 97.5%, treasury gets 2.5%", async function () {
    const { owner, alice, bob, cUSD, v2, proxy } =
      await loadFixture(deployUpgraded);
    const id = await registerBy(proxy.address, alice, "post");

    const bobV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: bob },
    });
    await bobV2.write.tipParagraph([id, paragraphKey(id, 0, "p"), HUNDRED]);

    const fee = (HUNDRED * BigInt(FEE_BPS)) / 10_000n;
    const net = HUNDRED - fee;
    expect(await v2.read.pendingOf([alice.account.address])).to.equal(net);
    expect(await v2.read.pendingOf([owner.account.address])).to.equal(fee);
    // Full gross amount is held by the contract until claims.
    expect(await cUSD.read.balanceOf([proxy.address])).to.equal(HUNDRED);

    const tips = await v2.getEvents.Tipped();
    expect(tips[tips.length - 1].args.amount).to.equal(HUNDRED);
    const fees = await v2.getEvents.FeeCollected();
    expect(fees[fees.length - 1].args.amount).to.equal(fee);
  });

  it("lets both author and treasury claim their balances", async function () {
    const { owner, alice, bob, cUSD, v2, proxy, publicClient } =
      await loadFixture(deployUpgraded);
    const id = await registerBy(proxy.address, alice, "claim");
    const bobV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: bob },
    });
    await bobV2.write.tipParagraph([id, paragraphKey(id, 0, "p"), HUNDRED]);

    const fee = (HUNDRED * BigInt(FEE_BPS)) / 10_000n;
    const net = HUNDRED - fee;

    const aliceBefore = await cUSD.read.balanceOf([alice.account.address]);
    const aliceV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: alice },
    });
    const t1 = await aliceV2.write.claimEarnings();
    await publicClient.waitForTransactionReceipt({ hash: t1 });
    expect(
      (await cUSD.read.balanceOf([alice.account.address])) - aliceBefore,
    ).to.equal(net);

    const ownerBefore = await cUSD.read.balanceOf([owner.account.address]);
    const ownerV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: owner },
    });
    const t2 = await ownerV2.write.claimEarnings();
    await publicClient.waitForTransactionReceipt({ hash: t2 });
    expect(
      (await cUSD.read.balanceOf([owner.account.address])) - ownerBefore,
    ).to.equal(fee);
  });

  it("charges nothing when the fee is set to 0", async function () {
    const { owner, alice, bob, v2, proxy } = await loadFixture(deployUpgraded);
    const ownerV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: owner },
    });
    await ownerV2.write.setFeeBps([0]);

    const id = await registerBy(proxy.address, alice, "free");
    const bobV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: bob },
    });
    await bobV2.write.tipParagraph([id, paragraphKey(id, 0, "p"), HUNDRED]);

    expect(await v2.read.pendingOf([alice.account.address])).to.equal(HUNDRED);
    expect(await v2.read.pendingOf([owner.account.address])).to.equal(0n);
  });

  it("enforces the 10% fee cap and owner-only fee changes", async function () {
    const { owner, alice, v2, proxy } = await loadFixture(deployUpgraded);
    const ownerV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: owner },
    });
    await ownerV2.write.setFeeBps([1000]); // exactly the cap is allowed
    expect(await v2.read.feeBps()).to.equal(1000);

    await expect(ownerV2.write.setFeeBps([1001])).to.be.rejected;

    const aliceV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: alice },
    });
    await expect(aliceV2.write.setFeeBps([100])).to.be.rejected;
  });

  it("guards setTreasury (no zero address, owner only)", async function () {
    const { owner, alice, v2, proxy } = await loadFixture(deployUpgraded);
    const ownerV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: owner },
    });
    await expect(ownerV2.write.setTreasury([zeroAddress])).to.be.rejected;

    await ownerV2.write.setTreasury([alice.account.address]);
    expect(getAddress(await v2.read.treasury())).to.equal(
      getAddress(alice.account.address),
    );

    const aliceV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: alice },
    });
    await expect(aliceV2.write.setTreasury([owner.account.address])).to.be
      .rejected;
  });

  it("cannot run initializeV2 twice", async function () {
    const { owner, v2, proxy } = await loadFixture(deployUpgraded);
    const ownerV2 = await hre.viem.getContractAt("TipJarV2", proxy.address, {
      client: { wallet: owner },
    });
    await expect(
      ownerV2.write.initializeV2([FEE_BPS, owner.account.address]),
    ).to.be.rejected;
  });
});

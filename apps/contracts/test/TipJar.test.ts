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
const FIVE = parseUnits("5", 18);
const TEN = parseUnits("10", 18);
const HUNDRED = parseUnits("100", 18);

async function deployFixture() {
  const [owner, alice, bob, carol] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const cUSD = await hre.viem.deployContract("MockCUSD", []);

  const tipJarImpl = await hre.viem.deployContract("TipJar", []);

  const initData = encodeFunctionData({
    abi: tipJarImpl.abi,
    functionName: "initialize",
    args: [owner.account.address, cUSD.address],
  });

  const proxy = await hre.viem.deployContract("ERC1967Proxy", [
    tipJarImpl.address,
    initData,
  ]);

  const tipJar = await hre.viem.getContractAt("TipJar", proxy.address);

  // Seed test wallets with mcUSD and pre-approve a large allowance.
  for (const w of [alice, bob, carol]) {
    await cUSD.write.mint([w.account.address, HUNDRED]);
    const cusdAs = await hre.viem.getContractAt("MockCUSD", cUSD.address, {
      client: { wallet: w },
    });
    await cusdAs.write.approve([tipJar.address, HUNDRED]);
  }

  return { owner, alice, bob, carol, publicClient, cUSD, tipJar, tipJarImpl };
}

function articleId(author: `0x${string}`, slug: string): `0x${string}` {
  // keccak256(abi.encodePacked(author, slug)) — author is 20 bytes, slug bytes.
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

describe("TipJar", function () {
  describe("initialization", function () {
    it("sets the owner and cUSD", async function () {
      const { owner, tipJar, cUSD } = await loadFixture(deployFixture);
      expect(getAddress(await tipJar.read.owner())).to.equal(
        getAddress(owner.account.address),
      );
      expect(getAddress(await tipJar.read.cUSD())).to.equal(
        getAddress(cUSD.address),
      );
    });

    it("reverts on direct initialize after proxy init", async function () {
      const { owner, tipJar, cUSD } = await loadFixture(deployFixture);
      await expect(
        tipJar.write.initialize([owner.account.address, cUSD.address]),
      ).to.be.rejected;
    });

    it("reverts when initializing impl directly", async function () {
      const { owner, tipJarImpl, cUSD } = await loadFixture(deployFixture);
      await expect(
        tipJarImpl.write.initialize([owner.account.address, cUSD.address]),
      ).to.be.rejected;
    });
  });

  describe("registerArticle", function () {
    it("stores author and emits ArticleRegistered", async function () {
      const { alice, tipJar, publicClient } = await loadFixture(deployFixture);
      const slug = "hello-world";
      const id = articleId(alice.account.address, slug);
      const contentHash = keccak256(stringToHex("# Hello\nWorld"));

      const tipJarAlice = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: alice } },
      );
      const txHash = await tipJarAlice.write.registerArticle([
        id,
        contentHash,
        slug,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      expect(getAddress(await tipJar.read.articleAuthor([id]))).to.equal(
        getAddress(alice.account.address),
      );

      const events = await tipJar.getEvents.ArticleRegistered();
      expect(events.length).to.equal(1);
      expect(events[0].args.author).to.equal(
        getAddress(alice.account.address),
      );
      expect(events[0].args.slug).to.equal(slug);
      expect(events[0].args.contentHash).to.equal(contentHash);
    });

    it("rejects double registration of the same articleId", async function () {
      const { alice, tipJar } = await loadFixture(deployFixture);
      const id = articleId(alice.account.address, "dupe");
      const contentHash = keccak256(stringToHex("x"));
      const tipJarAlice = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: alice } },
      );
      await tipJarAlice.write.registerArticle([id, contentHash, "dupe"]);
      await expect(
        tipJarAlice.write.registerArticle([id, contentHash, "dupe"]),
      ).to.be.rejected;
    });
  });

  describe("tipParagraph", function () {
    it("pulls cUSD, credits author balance, emits Tipped", async function () {
      const { alice, bob, tipJar, cUSD, publicClient } =
        await loadFixture(deployFixture);
      const id = articleId(alice.account.address, "post");
      const contentHash = keccak256(stringToHex("body"));
      const tipJarAlice = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: alice } },
      );
      await tipJarAlice.write.registerArticle([id, contentHash, "post"]);

      const pKey = paragraphKey(id, 0, "first paragraph");
      const tipJarBob = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: bob } },
      );
      const txHash = await tipJarBob.write.tipParagraph([id, pKey, ONE]);
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      expect(await tipJar.read.pendingOf([alice.account.address])).to.equal(ONE);
      expect(await cUSD.read.balanceOf([bob.account.address])).to.equal(
        HUNDRED - ONE,
      );
      expect(await cUSD.read.balanceOf([tipJar.address])).to.equal(ONE);

      const events = await tipJar.getEvents.Tipped();
      expect(events.length).to.equal(1);
      expect(events[0].args.amount).to.equal(ONE);
      expect(events[0].args.paragraphKey).to.equal(pKey);
      expect(events[0].args.tipper).to.equal(getAddress(bob.account.address));
    });

    it("accumulates multiple tips from many tippers across paragraphs", async function () {
      const { alice, bob, carol, tipJar } = await loadFixture(deployFixture);
      const id = articleId(alice.account.address, "multi");
      const contentHash = keccak256(stringToHex("z"));
      const tipJarAlice = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: alice } },
      );
      await tipJarAlice.write.registerArticle([id, contentHash, "multi"]);

      const tipJarBob = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: bob } },
      );
      const tipJarCarol = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: carol } },
      );

      await tipJarBob.write.tipParagraph([
        id,
        paragraphKey(id, 0, "p0"),
        ONE,
      ]);
      await tipJarBob.write.tipParagraph([
        id,
        paragraphKey(id, 1, "p1"),
        ONE,
      ]);
      await tipJarCarol.write.tipParagraph([
        id,
        paragraphKey(id, 1, "p1"),
        FIVE,
      ]);

      expect(await tipJar.read.pendingOf([alice.account.address])).to.equal(
        ONE + ONE + FIVE,
      );
    });

    it("reverts on unknown article", async function () {
      const { bob, tipJar } = await loadFixture(deployFixture);
      const id = articleId(bob.account.address, "ghost");
      const tipJarBob = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: bob } },
      );
      await expect(
        tipJarBob.write.tipParagraph([id, paragraphKey(id, 0, "x"), ONE]),
      ).to.be.rejected;
    });

    it("reverts on zero amount", async function () {
      const { alice, bob, tipJar } = await loadFixture(deployFixture);
      const id = articleId(alice.account.address, "zero");
      const tipJarAlice = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: alice } },
      );
      await tipJarAlice.write.registerArticle([
        id,
        keccak256(stringToHex("z")),
        "zero",
      ]);

      const tipJarBob = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: bob } },
      );
      await expect(
        tipJarBob.write.tipParagraph([id, paragraphKey(id, 0, "x"), 0n]),
      ).to.be.rejected;
    });

    it("reverts when allowance is insufficient", async function () {
      const { owner, alice, tipJar, cUSD } = await loadFixture(deployFixture);
      const id = articleId(alice.account.address, "allow");
      const tipJarAlice = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: alice } },
      );
      await tipJarAlice.write.registerArticle([
        id,
        keccak256(stringToHex("a")),
        "allow",
      ]);

      // owner is funded with 0 mcUSD and has no allowance.
      const tipJarOwner = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: owner } },
      );
      await expect(
        tipJarOwner.write.tipParagraph([id, paragraphKey(id, 0, "x"), ONE]),
      ).to.be.rejected;
    });
  });

  describe("claimEarnings", function () {
    it("sweeps balance, zeroes pending, emits Claimed", async function () {
      const { alice, bob, tipJar, cUSD, publicClient } =
        await loadFixture(deployFixture);
      const id = articleId(alice.account.address, "claim");
      const tipJarAlice = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: alice } },
      );
      await tipJarAlice.write.registerArticle([
        id,
        keccak256(stringToHex("c")),
        "claim",
      ]);

      const tipJarBob = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: bob } },
      );
      await tipJarBob.write.tipParagraph([id, paragraphKey(id, 0, "p"), TEN]);
      expect(await tipJar.read.pendingOf([alice.account.address])).to.equal(TEN);

      const aliceBefore = await cUSD.read.balanceOf([alice.account.address]);
      const txHash = await tipJarAlice.write.claimEarnings();
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      const aliceAfter = await cUSD.read.balanceOf([alice.account.address]);
      expect(aliceAfter - aliceBefore).to.equal(TEN);
      expect(await tipJar.read.pendingOf([alice.account.address])).to.equal(0n);

      const events = await tipJar.getEvents.Claimed();
      expect(events.length).to.equal(1);
      expect(events[0].args.amount).to.equal(TEN);
    });

    it("reverts when nothing to claim", async function () {
      const { alice, tipJar } = await loadFixture(deployFixture);
      const tipJarAlice = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: alice } },
      );
      await expect(tipJarAlice.write.claimEarnings()).to.be.rejected;
    });
  });

  describe("upgrade safety (UUPS)", function () {
    it("preserves V1 state through upgradeToAndCall to V2", async function () {
      const { owner, alice, bob, tipJar } = await loadFixture(deployFixture);
      const id = articleId(alice.account.address, "upg");
      const tipJarAlice = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: alice } },
      );
      await tipJarAlice.write.registerArticle([
        id,
        keccak256(stringToHex("u")),
        "upg",
      ]);

      const tipJarBob = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: bob } },
      );
      await tipJarBob.write.tipParagraph([id, paragraphKey(id, 0, "p"), ONE]);
      expect(await tipJar.read.pendingOf([alice.account.address])).to.equal(ONE);

      const v2Impl = await hre.viem.deployContract("TipJarV2", []);

      const ownerTipJar = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: owner } },
      );
      await ownerTipJar.write.upgradeToAndCall([v2Impl.address, "0x"]);

      // Treat proxy as V2 now.
      const v2 = await hre.viem.getContractAt("TipJarV2", tipJar.address);

      // V1 state survives.
      expect(getAddress(await v2.read.articleAuthor([id]))).to.equal(
        getAddress(alice.account.address),
      );
      expect(await v2.read.pendingOf([alice.account.address])).to.equal(ONE);

      // V2-only function works.
      const v2OwnerAs = await hre.viem.getContractAt(
        "TipJarV2",
        tipJar.address,
        { client: { wallet: owner } },
      );
      await v2OwnerAs.write.setVersion(["v2.0.0"]);
      expect(await v2.read.version()).to.equal("v2.0.0");
    });

    it("rejects upgrade from non-owner", async function () {
      const { alice, tipJar } = await loadFixture(deployFixture);
      const v2Impl = await hre.viem.deployContract("TipJarV2", []);
      const tipJarAlice = await hre.viem.getContractAt(
        "TipJar",
        tipJar.address,
        { client: { wallet: alice } },
      );
      await expect(tipJarAlice.write.upgradeToAndCall([v2Impl.address, "0x"]))
        .to.be.rejected;
    });
  });

  describe("guards", function () {
    it("constructor disables initializers on the implementation", async function () {
      const { tipJarImpl, owner, cUSD } = await loadFixture(deployFixture);
      await expect(
        tipJarImpl.write.initialize([owner.account.address, cUSD.address]),
      ).to.be.rejected;
    });

    it("initialize rejects zero addresses", async function () {
      // Deploy a fresh implementation and try initializing through a fresh proxy
      // with zero address — should revert.
      const tipJarImpl = await hre.viem.deployContract("TipJar", []);
      const [owner] = await hre.viem.getWalletClients();

      const badInit = encodeFunctionData({
        abi: tipJarImpl.abi,
        functionName: "initialize",
        args: [zeroAddress, zeroAddress],
      });
      await expect(
        hre.viem.deployContract("ERC1967Proxy", [tipJarImpl.address, badInit]),
      ).to.be.rejected;
    });
  });
});

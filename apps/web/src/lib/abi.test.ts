import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { erc20Abi, supportContractAbi, tipJarAbi, vaultAbi } from "./abi.js";

const hasFn = (abi: readonly unknown[], fn: string): boolean =>
  (abi as readonly { type?: string; name?: string }[]).some(
    (e) => e.type === "function" && e.name === fn,
  );

describe("tipJarAbi", () => {
  it("exposes the core TipJar functions the app calls", () => {
    for (const fn of [
      "registerArticle",
      "tipParagraph",
      "claimEarnings",
      "pendingOf",
      "support",
      "uniqueSupporters",
    ]) {
      assert.ok(hasFn(tipJarAbi, fn), `tipJarAbi missing ${fn}`);
    }
  });
});

describe("erc20Abi", () => {
  it("exposes approve and allowance for the tip/donate flows", () => {
    assert.ok(hasFn(erc20Abi, "approve"));
    assert.ok(hasFn(erc20Abi, "allowance"));
  });
});

describe("support and vault ABIs", () => {
  it("support exposes support(), vault exposes donate()", () => {
    assert.ok(hasFn(supportContractAbi, "support"));
    assert.ok(hasFn(vaultAbi, "donate"));
  });
});

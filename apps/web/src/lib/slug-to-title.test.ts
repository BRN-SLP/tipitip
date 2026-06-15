import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { slugToTitle } from "./slug-to-title.js";

describe("slugToTitle", () => {
  it("title-cases ordinary words", () => {
    assert.equal(
      slugToTitle("tip-writers-per-paragraph"),
      "Tip Writers Per Paragraph",
    );
  });

  it("preserves crypto acronyms via the map", () => {
    assert.equal(
      slugToTitle("celo-for-creators-cusd-as-gas"),
      "Celo For Creators cUSD As Gas",
    );
  });

  it("maps Web3 and NFTs casing", () => {
    assert.equal(slugToTitle("why-web3-needs-nfts"), "Why Web3 Needs NFTs");
  });

  it("brands TipiTip and MiniPay", () => {
    assert.equal(slugToTitle("tipitip-on-minipay"), "TipiTip On MiniPay");
  });

  it("drops empty segments from doubled dashes", () => {
    assert.equal(slugToTitle("a--b"), "A B");
  });

  it("returns an empty string for an empty slug", () => {
    assert.equal(slugToTitle(""), "");
  });
});

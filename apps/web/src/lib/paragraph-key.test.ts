import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { keccak256, stringToBytes } from "viem";

import {
  deriveArticleId,
  deriveContentHash,
  deriveParagraphKey,
  toBytes32Hex,
} from "./paragraph-key.js";

const bytes32 = /^0x[0-9a-f]{64}$/;
const ADDR = "0x1234567890abcdef1234567890abcdef12345678" as const;

describe("deriveContentHash", () => {
  it("matches keccak256 of the utf8 body", () => {
    assert.equal(
      deriveContentHash("hello world"),
      keccak256(stringToBytes("hello world")),
    );
  });

  it("is deterministic and collision-distinct", () => {
    assert.equal(deriveContentHash("a"), deriveContentHash("a"));
    assert.notEqual(deriveContentHash("a"), deriveContentHash("b"));
  });
});

describe("deriveArticleId", () => {
  it("returns a 32-byte hex", () => {
    assert.match(deriveArticleId(ADDR, "my-slug"), bytes32);
  });

  it("changes when the slug changes", () => {
    assert.notEqual(deriveArticleId(ADDR, "x"), deriveArticleId(ADDR, "y"));
  });
});

describe("deriveParagraphKey", () => {
  const id = deriveContentHash("article");

  it("is stable for the same article, index, and text", () => {
    assert.equal(
      deriveParagraphKey(id, 0, "para"),
      deriveParagraphKey(id, 0, "para"),
    );
  });

  it("differs when only the index changes (re-order safety)", () => {
    assert.notEqual(
      deriveParagraphKey(id, 0, "para"),
      deriveParagraphKey(id, 1, "para"),
    );
  });

  it("differs when only the text changes (edit safety)", () => {
    assert.notEqual(
      deriveParagraphKey(id, 0, "para"),
      deriveParagraphKey(id, 0, "edited"),
    );
  });
});

describe("toBytes32Hex", () => {
  it("left-pads a number into a 32-byte hex word", () => {
    assert.equal(
      toBytes32Hex(1),
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    );
  });
});

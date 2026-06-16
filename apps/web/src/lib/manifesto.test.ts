import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MANIFESTO } from "./manifesto.js";

const BYTES32 = /^0x[0-9a-f]{64}$/;

describe("MANIFESTO config", () => {
  it("pins a valid lowercase bytes32 on-chain article id", () => {
    assert.match(MANIFESTO.articleId, BYTES32);
  });

  it("carries non-empty eyebrow, excerpt and cta copy", () => {
    assert.ok(MANIFESTO.eyebrow.trim().length > 0);
    assert.ok(MANIFESTO.excerpt.trim().length > 0);
    assert.ok(MANIFESTO.cta.trim().length > 0);
  });
});

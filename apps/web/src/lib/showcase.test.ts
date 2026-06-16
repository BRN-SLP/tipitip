import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SHOWCASE_SITES } from "./showcase.js";

describe("SHOWCASE_SITES", () => {
  it("is a non-empty curated list", () => {
    assert.ok(SHOWCASE_SITES.length > 0);
  });

  it("every entry has the required fields", () => {
    for (const s of SHOWCASE_SITES) {
      assert.ok(s.name.trim().length > 0);
      assert.ok(s.href.length > 0);
      assert.ok(s.description.trim().length > 0);
      assert.equal(typeof s.external, "boolean");
    }
  });

  it("external entries use https, internal ones use a relative route", () => {
    for (const s of SHOWCASE_SITES) {
      if (s.external) assert.ok(s.href.startsWith("https://"));
      else assert.ok(s.href.startsWith("/"));
    }
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { toSlug } from "./slug.js";

describe("toSlug", () => {
  it("lowercases and hyphenates words", () => {
    assert.equal(toSlug("Hello World"), "hello-world");
  });

  it("collapses runs of non-alphanumerics into single hyphens", () => {
    assert.equal(toSlug("Special!@#Chars"), "special-chars");
  });

  it("trims leading and trailing hyphens", () => {
    assert.equal(toSlug("---leading-trailing---"), "leading-trailing");
  });

  it("caps the slug at the maximum length", () => {
    assert.equal(toSlug("a".repeat(120)).length, 80);
  });
});

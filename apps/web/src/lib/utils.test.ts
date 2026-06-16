import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cn } from "./utils.js";

describe("cn", () => {
  it("joins truthy class values", () => {
    assert.equal(cn("a", "b", "c"), "a b c");
  });

  it("drops falsy values", () => {
    assert.equal(cn("a", false, null, undefined, "", "b"), "a b");
  });

  it("flattens arrays and condition objects (clsx semantics)", () => {
    assert.equal(cn(["a", "b"], { c: true, d: false }), "a b c");
  });

  it("merges conflicting tailwind classes, last one wins", () => {
    assert.equal(cn("p-2", "p-4"), "p-4");
    assert.equal(cn("text-sm", "text-lg"), "text-lg");
  });

  it("keeps non-conflicting tailwind classes", () => {
    assert.equal(cn("px-2", "py-4"), "px-2 py-4");
  });
});

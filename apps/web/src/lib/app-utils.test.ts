import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatCurrency,
  isValidAddress,
  truncateAddress,
} from "./app-utils.js";

describe("formatCurrency", () => {
  it("formats a number as USD with two decimals", () => {
    assert.equal(formatCurrency(1234.5), "$1,234.50");
  });

  it("formats zero", () => {
    assert.equal(formatCurrency(0), "$0.00");
  });
});

describe("truncateAddress", () => {
  it("keeps the first 6 and last 4 characters by default", () => {
    assert.equal(
      truncateAddress("0x1234567890abcdef1234567890abcdef12345678"),
      "0x1234...5678",
    );
  });

  it("returns short strings unchanged", () => {
    assert.equal(truncateAddress("0x1234"), "0x1234");
  });

  it("honors custom start and end lengths", () => {
    assert.equal(truncateAddress("0xABCDEF1234", 4, 2), "0xAB...34");
  });
});

describe("isValidAddress", () => {
  it("accepts a well-formed 20-byte hex address", () => {
    assert.equal(
      isValidAddress("0x1234567890abcdef1234567890abcdef12345678"),
      true,
    );
  });

  it("rejects a too-short address", () => {
    assert.equal(isValidAddress("0x1234"), false);
  });

  it("rejects a missing 0x prefix", () => {
    assert.equal(
      isValidAddress("1234567890abcdef1234567890abcdef12345678"),
      false,
    );
  });

  it("rejects non-hex characters", () => {
    assert.equal(
      isValidAddress("0xZZZZ567890abcdef1234567890abcdef12345678"),
      false,
    );
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CUSD_MAINNET_ADDRESS,
  MINIPAY_TX_OVERRIDES,
  isMiniPayContext,
  openInMiniPayUrl,
} from "./minipay.js";

describe("openInMiniPayUrl", () => {
  it("wraps the target in the MiniPay open deeplink, url-encoded", () => {
    assert.equal(
      openInMiniPayUrl("https://tipitip.app/a/x?y=1&z=2"),
      "https://minipay.celo.org/open?url=https%3A%2F%2Ftipitip.app%2Fa%2Fx%3Fy%3D1%26z%3D2",
    );
  });

  it("encodes spaces and special characters", () => {
    assert.equal(
      openInMiniPayUrl("https://x.io/p q"),
      "https://minipay.celo.org/open?url=https%3A%2F%2Fx.io%2Fp%20q",
    );
  });
});

describe("isMiniPayContext", () => {
  it("returns false when there is no window (server-side render)", () => {
    assert.equal(isMiniPayContext(), false);
  });
});

describe("minipay constants", () => {
  it("pins the mainnet cUSD fee-currency address", () => {
    assert.equal(
      CUSD_MAINNET_ADDRESS,
      "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    );
  });

  it("uses cUSD as the MiniPay feeCurrency override", () => {
    assert.equal(MINIPAY_TX_OVERRIDES.feeCurrency, CUSD_MAINNET_ADDRESS);
  });
});

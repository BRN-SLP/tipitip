import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_BIO,
  MAX_LINKS,
  MAX_NAME,
  buildProfileMessage,
  linkSchema,
  profileInputSchema,
} from "./profile-shared.js";

const VALID = {
  address: "0x" + "a".repeat(40),
  isPublic: true,
  displayName: "Alice",
  bio: "Writer",
  links: [{ label: "site", url: "https://alice.dev" }],
};

describe("profileInputSchema", () => {
  it("accepts a valid profile", () => {
    assert.equal(profileInputSchema.safeParse(VALID).success, true);
  });

  it("rejects a malformed address", () => {
    assert.equal(
      profileInputSchema.safeParse({ ...VALID, address: "0xnope" }).success,
      false,
    );
  });

  it("rejects a display name over the limit", () => {
    assert.equal(
      profileInputSchema.safeParse({
        ...VALID,
        displayName: "x".repeat(MAX_NAME + 1),
      }).success,
      false,
    );
  });

  it("rejects a bio over the limit", () => {
    assert.equal(
      profileInputSchema.safeParse({ ...VALID, bio: "x".repeat(MAX_BIO + 1) })
        .success,
      false,
    );
  });

  it("rejects more than MAX_LINKS links", () => {
    const links = Array.from({ length: MAX_LINKS + 1 }, () => ({
      label: "l",
      url: "https://x.io",
    }));
    assert.equal(
      profileInputSchema.safeParse({ ...VALID, links }).success,
      false,
    );
  });

  it("trims the display name before validating", () => {
    const r = profileInputSchema.safeParse({ ...VALID, displayName: "  Bob  " });
    assert.equal(r.success, true);
    if (r.success) assert.equal(r.data.displayName, "Bob");
  });
});

describe("linkSchema", () => {
  it("requires an https url", () => {
    assert.equal(
      linkSchema.safeParse({ label: "x", url: "http://x.io" }).success,
      false,
    );
  });

  it("rejects an empty label", () => {
    assert.equal(
      linkSchema.safeParse({ label: "", url: "https://x.io" }).success,
      false,
    );
  });
});

describe("buildProfileMessage", () => {
  it("builds the canonical signable message with a lowercased address", () => {
    const msg = buildProfileMessage(
      {
        address: "0xABCDEF" + "0".repeat(34),
        isPublic: true,
        displayName: "Al",
        bio: "hi",
        links: [{ label: "s", url: "https://a.io" }],
      },
      1700000000,
    );
    assert.equal(
      msg,
      [
        "TipiTip: update my writer profile",
        `address: 0xabcdef${"0".repeat(34)}`,
        "public: true",
        "name: Al",
        "bio: hi",
        "links: s|https://a.io",
        "issued: 1700000000",
      ].join("\n"),
    );
  });

  it("joins multiple links with a comma", () => {
    const msg = buildProfileMessage(
      {
        address: "0x" + "0".repeat(40),
        isPublic: false,
        displayName: "",
        bio: "",
        links: [
          { label: "a", url: "https://a.io" },
          { label: "b", url: "https://b.io" },
        ],
      },
      1,
    );
    assert.ok(msg.includes("links: a|https://a.io, b|https://b.io"));
  });
});

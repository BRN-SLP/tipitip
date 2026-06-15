import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractTitleAndExcerpt,
  normalizeTags,
  splitParagraphs,
} from "./articles.js";

describe("normalizeTags", () => {
  it("lowercases and hyphenates a free-form list", () => {
    assert.deepEqual(normalizeTags(["AI Agents", "DeFi"]), [
      "ai-agents",
      "defi",
    ]);
  });

  it("splits a comma string, converts underscores, and dedupes", () => {
    assert.deepEqual(normalizeTags("ai_agents, Crypto, ai-agents"), [
      "ai-agents",
      "crypto",
    ]);
  });

  it("drops segments shorter than two characters", () => {
    assert.deepEqual(normalizeTags(["a", "ok"]), ["ok"]);
  });

  it("clamps to five tags", () => {
    assert.deepEqual(normalizeTags(["t1", "t2", "t3", "t4", "t5", "t6"]), [
      "t1",
      "t2",
      "t3",
      "t4",
      "t5",
    ]);
  });
});

describe("extractTitleAndExcerpt", () => {
  it("uses a leading H1 as the title and the next line as the excerpt", () => {
    assert.deepEqual(
      extractTitleAndExcerpt("# My Title\n\nFirst paragraph here.", "fb"),
      { title: "My Title", excerpt: "First paragraph here." },
    );
  });

  it("falls back to the first non-empty line when there is no H1", () => {
    assert.deepEqual(
      extractTitleAndExcerpt("Plain first line\n\nSecond.", "fb"),
      { title: "Plain first line", excerpt: "Second." },
    );
  });

  it("uses the fallback title and a null excerpt for an empty body", () => {
    assert.deepEqual(extractTitleAndExcerpt("", "Untitled"), {
      title: "Untitled",
      excerpt: null,
    });
  });
});

describe("splitParagraphs", () => {
  it("splits on blank lines and trims", () => {
    assert.deepEqual(splitParagraphs("Para one\n\nPara two"), [
      "Para one",
      "Para two",
    ]);
  });

  it("collapses multiple blank lines into one break", () => {
    assert.deepEqual(splitParagraphs("A\n\n\n\nB"), ["A", "B"]);
  });

  it("keeps a fenced code block as a single paragraph", () => {
    const md = "Intro\n\n```\ncode\n\nstill code\n```\n\nOutro";
    assert.deepEqual(splitParagraphs(md), [
      "Intro",
      "```\ncode\n\nstill code\n```",
      "Outro",
    ]);
  });
});

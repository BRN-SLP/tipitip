import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Hex } from "viem";

import { splitParagraphs } from "./articles.js";
import type { RawEventLog } from "./chain-logs.js";
import { deriveParagraphKey } from "./paragraph-key.js";
import {
  aggregateArticleEarnings,
  paragraphIndexByKey,
  paragraphSnippet,
} from "./tip-aggregation.js";

const ARTICLE_ID = ("0x" + "ab".repeat(32)) as Hex;

function mkLog(
  paragraphKey: string | undefined,
  amount: bigint | undefined,
  tipper?: string,
): RawEventLog {
  return { args: { paragraphKey, amount, tipper } } as unknown as RawEventLog;
}

describe("paragraphSnippet", () => {
  it("collapses whitespace and trims", () => {
    assert.equal(
      paragraphSnippet("  hello   world \n\n now "),
      "hello world now",
    );
  });

  it("strips a leading heading marker", () => {
    assert.equal(paragraphSnippet("## Big title"), "Big title");
  });

  it("strips a leading blockquote or list marker", () => {
    assert.equal(paragraphSnippet("> quoted"), "quoted");
    assert.equal(paragraphSnippet("- item"), "item");
    assert.equal(paragraphSnippet("* item"), "item");
    assert.equal(paragraphSnippet("+ item"), "item");
  });

  it("strips inline emphasis characters", () => {
    assert.equal(paragraphSnippet("**bold** _em_ `code`"), "bold em code");
  });

  it("replaces fenced code blocks with a placeholder", () => {
    assert.equal(paragraphSnippet("```js\nconst a = 1;\n```"), "[code]");
  });

  it("clamps to max length with an ellipsis", () => {
    const out = paragraphSnippet("x".repeat(200), 50);
    assert.equal(out.length, 50);
    assert.ok(out.endsWith("…"));
  });

  it("leaves a short string unchanged", () => {
    assert.equal(paragraphSnippet("short", 50), "short");
  });
});

describe("aggregateArticleEarnings", () => {
  const body = "First paragraph here.\n\nSecond paragraph here.";
  const paras = splitParagraphs(body);
  const key0 = deriveParagraphKey(ARTICLE_ID, 0, paras[0]);
  const key1 = deriveParagraphKey(ARTICLE_ID, 1, paras[1]);

  it("splits the sample body into two paragraphs", () => {
    assert.equal(paras.length, 2);
  });

  it("sums headline totals, count and unique supporters across all tips", () => {
    const logs = [
      mkLog(key0, 10n, "0xAlice"),
      mkLog(key0, 20n, "0xBob"),
      mkLog(key1, 5n, "0xAlice"),
    ];
    const out = aggregateArticleEarnings(ARTICLE_ID, body, logs);
    assert.equal(out.total, 35n);
    assert.equal(out.count, 3);
    assert.equal(out.supporters, 2);
  });

  it("ranks paragraphs by total, highest first", () => {
    const logs = [
      mkLog(key0, 10n, "0xAlice"),
      mkLog(key0, 20n, "0xBob"),
      mkLog(key1, 5n, "0xAlice"),
    ];
    const out = aggregateArticleEarnings(ARTICLE_ID, body, logs);
    assert.equal(out.paragraphs.length, 2);
    assert.equal(out.paragraphs[0].index, 0);
    assert.equal(out.paragraphs[0].total, 30n);
    assert.equal(out.paragraphs[0].count, 2);
    assert.equal(out.paragraphs[1].index, 1);
    assert.equal(out.paragraphs[1].total, 5n);
  });

  it("counts a tip on a stale paragraphKey in the total but in no row", () => {
    const stale = ("0x" + "cd".repeat(32)) as Hex;
    const logs = [mkLog(key0, 10n, "0xAlice"), mkLog(stale, 99n, "0xBob")];
    const out = aggregateArticleEarnings(ARTICLE_ID, body, logs);
    assert.equal(out.total, 109n);
    assert.equal(out.count, 2);
    const rowTotal = out.paragraphs.reduce((s, p) => s + p.total, 0n);
    assert.equal(rowTotal, 10n);
  });

  it("skips logs missing a paragraphKey or amount", () => {
    const logs = [
      mkLog(undefined, 10n, "0xAlice"),
      mkLog(key0, undefined, "0xBob"),
      mkLog(key0, 7n, "0xCarol"),
    ];
    const out = aggregateArticleEarnings(ARTICLE_ID, body, logs);
    assert.equal(out.total, 7n);
    assert.equal(out.count, 1);
    assert.equal(out.supporters, 1);
  });

  it("returns an empty breakdown for no logs", () => {
    const out = aggregateArticleEarnings(ARTICLE_ID, body, []);
    assert.equal(out.total, 0n);
    assert.equal(out.count, 0);
    assert.equal(out.supporters, 0);
    assert.deepEqual(out.paragraphs, []);
  });
});

describe("paragraphIndexByKey", () => {
  const body = "Alpha paragraph.\n\nBeta paragraph.";
  const paras = splitParagraphs(body);

  it("maps every current paragraphKey to its index and snippet", () => {
    const map = paragraphIndexByKey(ARTICLE_ID, body);
    assert.equal(map.size, paras.length);
    paras.forEach((text, i) => {
      const k = deriveParagraphKey(ARTICLE_ID, i, text).toLowerCase();
      assert.deepEqual(map.get(k), { index: i, snippet: paragraphSnippet(text) });
    });
  });
});

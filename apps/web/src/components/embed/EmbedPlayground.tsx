"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { TipParagraphs } from "@tipitip/embed";

type Mode = "lite" | "inline" | "vanilla";

const MODES: { id: Mode; label: string; blurb: string }[] = [
  { id: "lite", label: "Lite (React)", blurb: "Zero deps. Deep-links to TipiTip to sign." },
  { id: "inline", label: "Inline (React)", blurb: "Signs in place. Needs viem." },
  { id: "vanilla", label: "Vanilla (HTML)", blurb: "No React. One script tag." },
];

const PLACEHOLDER_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

function snippetFor(mode: Mode, articleId: string): string {
  const id = articleId || "0x…";
  if (mode === "lite") {
    return [
      "pnpm add @tipitip/embed",
      "",
      'import { TipParagraphs } from "@tipitip/embed";',
      "",
      `<TipParagraphs articleId="${id}" />`,
    ].join("\n");
  }
  if (mode === "inline") {
    return [
      "pnpm add @tipitip/embed viem",
      "",
      'import { TipParagraphsInline } from "@tipitip/embed/inline";',
      "",
      `<TipParagraphsInline articleId="${id}" />`,
    ].join("\n");
  }
  return [
    '<script type="module"',
    '  src="https://esm.sh/@tipitip/embed/vanilla"></script>',
    "",
    `<tipitip-paragraphs article-id="${id}"></tipitip-paragraphs>`,
  ].join("\n");
}

export function EmbedPlayground({ defaultArticleId }: { defaultArticleId: string }) {
  const [mode, setMode] = useState<Mode>("lite");
  const [articleId, setArticleId] = useState<string>(defaultArticleId);
  const [copied, setCopied] = useState(false);
  // Pin the live preview to this deployment's own origin so the playground
  // is self-consistent on preview and production alike. The copyable snippet
  // intentionally omits baseUrl — real integrators want the canonical default.
  const [origin, setOrigin] = useState<string | undefined>(undefined);
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippet = useMemo(() => snippetFor(mode, articleId), [mode, articleId]);
  const validId = /^0x[0-9a-fA-F]{64}$/.test(articleId.trim());

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked — no-op
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Controls + snippet */}
      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="playground-article-id"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Article ID
          </label>
          <input
            id="playground-article-id"
            value={articleId}
            spellCheck={false}
            onChange={(e) => setArticleId(e.target.value)}
            placeholder={PLACEHOLDER_ID}
            className="w-full rounded-md border border-border bg-card px-3 py-2 font-mono text-xs outline-none focus:border-primary"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Publish at{" "}
            <a href="/write" className="underline">
              /write
            </a>{" "}
            to get your own, or keep the live example loaded.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                mode === m.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {MODES.find((m) => m.id === mode)?.blurb}
        </p>

        <div className="relative">
          <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 pr-12 text-[12.5px] leading-relaxed">
            <code className="font-mono">{snippet}</code>
          </pre>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy snippet"
            className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="flex flex-col">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Live preview
        </p>
        <div className="flex-1 rounded-lg border border-dashed border-border bg-secondary/30 p-5">
          {validId ? (
            <TipParagraphs
              articleId={articleId.trim() as `0x${string}`}
              baseUrl={origin}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter a valid 32-byte article id (0x + 64 hex chars) to render a
              live embed.
            </p>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Preview uses the lite embed (read-and-redirect). Inline and vanilla
          render the same paragraphs but complete the tip without leaving the
          page.
        </p>
      </div>
    </div>
  );
}

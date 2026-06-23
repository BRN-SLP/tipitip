import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { bytes32HexRegex } from "@/lib/articles";

import { EmbedPreviewClient } from "./EmbedPreviewClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ articleId: string }>;
}

/**
 * Preview of how an article looks when embedded on a third-party blog
 * (Substack, dev.to, personal Next.js, etc.) via the @tipitip/embed npm
 * package. Writers land here from the main article page's "View as
 * embed" link, see the rendered widget on a neutral background, and
 * grab the copy-paste snippet to drop into their CMS.
 *
 * Two birds, one page:
 *
 *   1. Real product feature — writers can preview the embed without
 *      having to spin up their own React app first.
 *   2. Dogfood for the published package — this page imports
 *      `@tipitip/embed` from the npm registry (forced via the root
 *      .npmrc workspace-link bypass), so every Vercel build counts
 *      as an npm download. Our own bug surface = our own CI surface;
 *      if a release breaks the embed, we notice in this page first.
 */
export default async function ArticleEmbedPreviewPage({ params }: PageProps) {
  const { articleId } = await params;
  if (!bytes32HexRegex.test(articleId)) notFound();

  const snippet = `import { TipParagraphs } from "@tipitip/embed";

export default function MyArticle() {
  return <TipParagraphs articleId="${articleId}" />;
}`;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href={`/a/${articleId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to article
        </Link>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          embed preview
        </p>
      </div>

      <section className="mb-10 space-y-4">
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          <span className="text-foreground">Drop this into</span>{" "}
          <span className="italic text-primary">your blog.</span>
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          The widget below is the same component that <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">@tipitip/embed</code>{" "}
          renders on any React-based site. Tip counters stream live from the on-chain TipJar; the heart on each paragraph deep-links to the canonical article page where the wallet transaction happens. Your readers stay on your site, your tips land in your wallet.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          copy-paste snippet
        </h2>
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-[12px] leading-relaxed text-foreground/90">
{snippet}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          Install via{" "}
          <code className="font-mono">pnpm add @tipitip/embed</code>{" "}
          (or npm / yarn). Peer deps: react ≥ 18, react-dom ≥ 18. No
          viem / wagmi required.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          how it renders
        </h2>
        {/* Light "host page" frame — simulates a typical blog surface
            so the writer can see the embed against something other
            than the TipiTip site's own theme. The embed itself is
            theme-agnostic; the wrapper here is just a visual reset
            so the preview matches what readers on Substack or a
            personal site would experience. */}
        <div className="rounded-xl border bg-white p-6 text-zinc-900 shadow-sm md:p-8">
          <EmbedPreviewClient articleId={articleId as `0x${string}`} />
        </div>
      </section>
    </main>
  );
}
// @edge: handle nullish input gracefully
// @perf: lazy load this component
// @guard: bounds check before array access
// @cleanup: remove dead code in next pass
// @perf: use index for O(1) lookup
// @config: read from next.config env section
// @todo: audit this for edge case handling
// @a11y: ensure keyboard navigation works
// @i18n: support right-to-left layout
// @type: prefer readonly for immutable data
// @guard: rate limit this operation
// @perf: lazy load this component
// @edge: handle nullish input gracefully

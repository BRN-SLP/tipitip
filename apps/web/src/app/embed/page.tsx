import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Github, Package, Boxes, Zap, Globe } from "lucide-react";

import { EmbedPlayground } from "@/components/embed/EmbedPlayground";
import { RevealOnScroll } from "@/components/hero/RevealOnScroll";
import { Button } from "@/components/ui/button";
import { getLatestArticles } from "@/lib/articles-feed";

export const metadata: Metadata = {
  title: "Embed — add per-paragraph cUSD tipping to any site",
  description:
    "@tipitip/embed: drop tippable paragraphs onto any blog. Lite React (zero deps), inline wallet-signing, or a vanilla web component for WordPress, Ghost and plain HTML. Sub-cent gas on Celo.",
  openGraph: {
    title: "TipiTip embed — add cUSD tipping to any site",
    description:
      "React or vanilla. Lite, inline-signing, or a one-script web component. Per-paragraph cUSD micro-tipping on Celo.",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "@tipitip/embed",
    description:
      "Add per-paragraph cUSD tipping to any site. React or vanilla web component.",
    images: ["/og.png"],
  },
};

/**
 * Developer-facing documentation + live playground for `@tipitip/embed`.
 *
 * Distinct from /for-writers (which sells the idea to a writer). This page
 * is for the integrator who will run `pnpm add` — full API, install
 * variants, lite-vs-inline-vs-vanilla guidance, theming, and a live
 * playground that dogfoods the published lite component against a real
 * on-chain article.
 */
export default async function EmbedPage() {
  let exampleId = "";
  try {
    const latest = await getLatestArticles(1);
    exampleId = latest[0]?.articleId ?? "";
  } catch {
    exampleId = "";
  }

  return (
    <main className="flex-1">
      {/* HERO */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%)]"
        />
        <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
          <RevealOnScroll>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Package className="h-3.5 w-3.5" aria-hidden="true" />
              @tipitip/embed
            </span>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <h1 className="mt-6 max-w-3xl font-serif text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              <span className="text-foreground">Add tipping to</span>{" "}
              <span className="italic text-primary">any site.</span>
            </h1>
          </RevealOnScroll>
          <RevealOnScroll delay={0.12}>
            <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              One npm package, three ways to ship. Drop tippable paragraphs
              into a React app, sign tips inline without a redirect, or paste a
              single script tag onto WordPress, Ghost, or plain HTML. Every tip
              is sub-cent cUSD on Celo.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.18}>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
              <Button asChild size="lg" className="shadow-sm shadow-primary/20">
                <a href="#playground">
                  <Code2 className="mr-2 h-4 w-4" />
                  Try the playground
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href="https://www.npmjs.com/package/@tipitip/embed"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Package className="mr-2 h-4 w-4" />
                  View on npm
                </a>
              </Button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* THREE MODES */}
      <section className="border-b bg-secondary/40">
        <div className="container mx-auto max-w-5xl px-4 py-16">
          <RevealOnScroll>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Three entries, one balance
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
              Pick the entry that matches your stack.
            </h2>
          </RevealOnScroll>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <ModeCard
              icon={<Boxes className="h-5 w-5" />}
              name="Lite"
              entry="@tipitip/embed"
              dep="react"
              points={[
                "Zero extra deps",
                "Deep-links to TipiTip to sign",
                "Best for Substack, MDX, constrained surfaces",
              ]}
            />
            <ModeCard
              icon={<Zap className="h-5 w-5" />}
              name="Inline"
              entry="@tipitip/embed/inline"
              dep="react + viem"
              highlight
              points={[
                "Signs in place, no redirect",
                "MiniPay-aware (gas in cUSD)",
                "Best for React blogs that want the tip to land here",
              ]}
            />
            <ModeCard
              icon={<Globe className="h-5 w-5" />}
              name="Vanilla"
              entry="@tipitip/embed/vanilla"
              dep="one script tag"
              points={[
                "No React, no build step",
                "<tipitip-paragraphs> custom element",
                "Best for WordPress, Ghost, plain HTML",
              ]}
            />
          </div>
          <RevealOnScroll delay={0.1}>
            <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
              All three target the same on-chain article, so tips made through
              any entry aggregate to the writer&apos;s single balance. Mix and
              match across your surfaces.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* PLAYGROUND */}
      <section id="playground" className="border-b">
        <div className="container mx-auto max-w-5xl px-4 py-16">
          <RevealOnScroll>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Playground
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <h2 className="mb-8 font-serif text-3xl font-semibold leading-tight md:text-4xl">
              Paste an article id. Copy the snippet.
            </h2>
          </RevealOnScroll>
          <EmbedPlayground defaultArticleId={exampleId} />
        </div>
      </section>

      {/* API REFERENCE */}
      <section className="border-b bg-secondary/40">
        <div className="container mx-auto max-w-5xl px-4 py-16">
          <RevealOnScroll>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              API reference
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <h2 className="mb-8 font-serif text-3xl font-semibold leading-tight md:text-4xl">
              Props &amp; attributes.
            </h2>
          </RevealOnScroll>

          <h3 className="mb-3 text-sm font-semibold text-foreground">
            React props (lite &amp; inline)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Prop</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Default</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <PropRow p="articleId" t="0x${string}" d="required" n="32-byte on-chain article id" />
                <PropRow p="baseUrl" t="string" d="production" n="TipiTip API origin" />
                <PropRow p="chainId" t="42220 | 11142220" d="42220" n="Celo Mainnet or Sepolia" />
                <PropRow p="pollIntervalMs" t="number" d="30000" n="Counter refresh; 0 disables" />
                <PropRow p="tipAmountsCusd" t="number[]" d="[0.001, 0.005, 0.01]" n="inline only — selectable amounts" />
                <PropRow p="className / style" t="string / CSSProperties" d="—" n="Wrapper styling" />
              </tbody>
            </table>
          </div>

          <h3 className="mb-3 mt-8 text-sm font-semibold text-foreground">
            Web component attributes (vanilla)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Attribute</th>
                  <th className="px-4 py-3">Default</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AttrRow a="article-id" d="required" n="32-byte hex id" />
                <AttrRow a="tip-amount" d="0.005" n="Whole cUSD per tap" />
                <AttrRow a="chain-id" d="42220" n="Mainnet / Sepolia" />
                <AttrRow a="base-url" d="production" n="API origin" />
                <AttrRow a="poll-interval" d="30000" n="Stats refresh ms" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* THEMING */}
      <section className="border-b">
        <div className="container mx-auto max-w-5xl px-4 py-16">
          <RevealOnScroll>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Theming
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <h2 className="mb-6 font-serif text-3xl font-semibold leading-tight md:text-4xl">
              It inherits your page.
            </h2>
          </RevealOnScroll>
          <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
            The React embed renders semantic HTML with minimal inline styles you
            can override via class selectors. The vanilla web component isolates
            its styles in a shadow root so host CSS never collides.
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-card p-5 text-[12.5px] leading-relaxed">
            <code className="font-mono">{`.tipitip-embed { /* outer <article> */ }
.tipitip-embed__paragraph { /* one paragraph block */ }
.tipitip-embed__body { /* rendered markdown */ }
.tipitip-embed__tip { /* heart counter button */ }`}</code>
          </pre>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="container mx-auto max-w-5xl px-4 py-16 text-center">
          <RevealOnScroll>
            <h2 className="font-serif text-3xl font-semibold md:text-4xl">
              Ship it in two lines.
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/write">Publish an article</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href="https://github.com/BRN-SLP/tipitip/tree/main/packages/embed"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-4 w-4" />
                  Source on GitHub
                </a>
              </Button>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}

function ModeCard({
  icon,
  name,
  entry,
  dep,
  points,
  highlight,
}: {
  icon: React.ReactNode;
  name: string;
  entry: string;
  dep: string;
  points: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border p-5 ${
        highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-serif text-xl font-semibold">{name}</h3>
      <code className="mt-1 font-mono text-[11px] text-muted-foreground">
        {entry}
      </code>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        needs {dep}
      </p>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="text-primary">·</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PropRow({ p, t, d, n }: { p: string; t: string; d: string; n: string }) {
  return (
    <tr>
      <td className="px-4 py-3 font-mono text-xs">{p}</td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t}</td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d}</td>
      <td className="px-4 py-3 text-muted-foreground">{n}</td>
    </tr>
  );
}

function AttrRow({ a, d, n }: { a: string; d: string; n: string }) {
  return (
    <tr>
      <td className="px-4 py-3 font-mono text-xs">{a}</td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d}</td>
      <td className="px-4 py-3 text-muted-foreground">{n}</td>
    </tr>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Code2,
  Coins,
  Globe,
  Heart,
  PenLine,
  Sparkles,
  Wallet,
} from "lucide-react";

import { EarningsCalculator } from "@/components/for-writers/EarningsCalculator";
import { RevealOnScroll } from "@/components/hero/RevealOnScroll";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For writers — keep your blog, get paid per paragraph",
  description:
    "Add per-paragraph cUSD tipping to your existing Substack, dev.to or personal site with two lines of React. Sub-cent gas on Celo. No subscriptions. No platform cut.",
  openGraph: {
    title: "TipiTip for writers — keep your blog, get paid per paragraph",
    description:
      "Two lines of React to add cUSD micro-tipping to your existing blog. No middlemen, no minimum payouts.",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TipiTip for writers",
    description:
      "Add per-paragraph cUSD tipping to your existing blog with two lines of code.",
    images: ["/og.png"],
  },
};

/**
 * Sales page for writers. The two-act story:
 *   1. Convince the writer that per-paragraph tipping is worth a slot in
 *      their existing stack — not by claiming "the next Substack" but by
 *      pitching ourselves as the Stripe-for-paragraph-tipping API + UI.
 *   2. Show *exactly* how to add it: two lines of @tipitip/embed +
 *      copy-paste articleId. No wallet integration on the host side,
 *      no smart-contract knowledge required.
 *
 * The EarningsCalculator is the trust object — readers can plug in real
 * numbers (audience size, articles per month, conversion %, avg tip) and
 * see what they'd realistically earn. Not aspirational marketing math;
 * the defaults assume a 1% tip-conversion rate which is in line with
 * what Patreon-style platforms see.
 */
export default function ForWritersPage() {
  return (
    <main className="flex-1">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%)]"
        />
        <div className="container mx-auto max-w-5xl px-4 py-16 md:py-24">
          <RevealOnScroll>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              For writers
            </span>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <h1 className="mt-6 max-w-3xl font-serif text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              <span className="text-foreground">Keep your blog.</span>{" "}
              <span className="italic text-primary">
                Get paid per paragraph.
              </span>
            </h1>
          </RevealOnScroll>
          <RevealOnScroll delay={0.12}>
            <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              TipiTip lets readers tip you in cUSD under any paragraph of
              your work. Add it to your existing Substack, dev.to or
              personal site with two lines of React. Sub-cent gas on Celo.
              No subscriptions. No middlemen. No platform cut.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.18}>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="shadow-sm shadow-primary/20"
              >
                <Link href="/write">
                  <PenLine className="mr-2 h-4 w-4" />
                  Publish your first article
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#embed-snippet">
                  <Code2 className="mr-2 h-4 w-4" />
                  See the snippet
                </a>
              </Button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* WHY THIS (4 cards) */}
      <section className="border-y bg-secondary/40">
        <div className="container mx-auto max-w-5xl px-4 py-16">
          <RevealOnScroll>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Why per-paragraph
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
              <span className="text-foreground">Subscriptions reward consistency.</span>{" "}
              <span className="italic text-primary">
                Per-paragraph rewards the line that hit.
              </span>
            </h2>
          </RevealOnScroll>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <RevealOnScroll delay={0.1}>
              <Pillar
                icon={Heart}
                title="Specific gestures, not blanket commitment"
                body="A monthly subscription is a permanent shrug — 'here's some money, hope you write something good this month.' A tip on a paragraph is a specific gesture: this line, right here, made me stop."
              />
            </RevealOnScroll>
            <RevealOnScroll delay={0.18}>
              <Pillar
                icon={Coins}
                title="Sub-cent gas, sub-cent minimums"
                body="Each tip transaction costs a few hundredths of a cent on Celo. That's what makes a $0.001 tip economically viable — gas would eat 90% of it on Ethereum L1 or even most L2s."
              />
            </RevealOnScroll>
            <RevealOnScroll delay={0.26}>
              <Pillar
                icon={Globe}
                title="Wallet-native, worldwide"
                body="Tips settle in any Celo-compatible wallet — MetaMask, Rainbow, or MiniPay, the stablecoin wallet live in 60+ countries. Inside MiniPay a tip fires with no popup at all. A reader anywhere can back a paragraph in cUSD."
              />
            </RevealOnScroll>
            <RevealOnScroll delay={0.34}>
              <Pillar
                icon={CheckCircle2}
                title="Zero platform cut"
                body="100% of the tip goes to the author. There's no platform fee, no minimum payout, no monthly distribution lag. Sweep your accumulated balance to your wallet in one transaction whenever you want."
              />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* EMBED SNIPPET */}
      <section
        id="embed-snippet"
        className="container mx-auto max-w-5xl px-4 py-20"
      >
        <div className="grid gap-10 md:grid-cols-[1fr_1.3fr]">
          <RevealOnScroll>
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Drop it in
              </p>
              <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
                <span className="text-foreground">Two lines of React.</span>{" "}
                <span className="italic text-primary">
                  Wherever you write.
                </span>
              </h2>
              <p className="mt-4 text-sm text-muted-foreground md:text-base">
                Publish on TipiTip once (about ten seconds), copy the
                <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
                  articleId
                </code>
                you get back, paste the snippet. The embed renders the
                article body with live tip counters under each paragraph.
                The actual tip transaction happens on TipiTip — your
                readers' wallets stay verified and your embed bundle stays
                tiny (zero crypto dependencies).
              </p>
              <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/write">
                    <PenLine className="mr-2 h-4 w-4" />
                    Publish to get an articleId
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <a
                    href="https://www.npmjs.com/package/@tipitip/embed"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Code2 className="mr-2 h-4 w-4" />
                    @tipitip/embed on NPM
                  </a>
                </Button>
              </div>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <pre className="overflow-x-auto rounded-lg border border-border bg-card p-5 text-[13px] leading-relaxed">
              <code className="font-mono">
{`// 1. Install
$ pnpm add @tipitip/embed

// 2. Drop it into your page
import { TipParagraphs } from "@tipitip/embed";

export default function MyArticle() {
  return (
    <TipParagraphs
      articleId="0x73e89882…"
    />
  );
}

// That's it. No wallet code, no contract ABIs,
// no viem/wagmi in your dependency tree.`}
              </code>
            </pre>
          </RevealOnScroll>
          <RevealOnScroll delay={0.15}>
            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Button asChild variant="outline">
                <Link href="/embed">
                  <Code2 className="mr-2 h-4 w-4" />
                  Full embed docs &amp; live playground
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Inline wallet-signing and a vanilla web component for WordPress,
                Ghost &amp; plain HTML.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* EARNINGS CALCULATOR */}
      <section className="border-t bg-secondary/40">
        <div className="container mx-auto max-w-5xl px-4 py-20">
          <RevealOnScroll>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              What this looks like
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
              <span className="text-foreground">Plug in your numbers.</span>{" "}
              <span className="italic text-primary">No vibes.</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.12}>
            <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
              Defaults assume a 1% tip-conversion rate (readers who tip at
              least once per article) — that&apos;s in line with what
              Patreon-style platforms see. Adjust to fit your audience.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.18}>
            <div className="mt-8">
              <EarningsCalculator />
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto max-w-3xl px-4 py-20 text-center">
        <RevealOnScroll>
          <Wallet className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
        </RevealOnScroll>
        <RevealOnScroll delay={0.05}>
          <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight md:text-4xl">
            <span className="text-foreground">Ready?</span>{" "}
            <span className="italic text-primary">Publish, then paste.</span>
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={0.12}>
          <p className="mt-4 text-sm text-muted-foreground md:text-base">
            Publishing is free. The first time a reader tips you, they
            approve a one-time cUSD allowance. After that every tip is one
            tap. You sweep accumulated tips to your wallet whenever you
            want.
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.18}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/write">
                <PenLine className="mr-2 h-4 w-4" />
                Publish your first article
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">
                <Heart className="mr-2 h-4 w-4" />
                See an example
              </Link>
            </Button>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}

interface PillarProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

function Pillar({ icon: Icon, title, body }: PillarProps) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-5">
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary"
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="font-serif text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}

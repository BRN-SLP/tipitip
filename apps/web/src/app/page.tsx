import Link from "next/link";
import { BookOpen, Heart, PenLine, Sparkles } from "lucide-react";

import { FloatingHeart } from "@/components/hero/FloatingHeart";
import { RevealOnScroll } from "@/components/hero/RevealOnScroll";
import { TypewriterTagline } from "@/components/hero/TypewriterTagline";
import { FeaturedReads } from "@/components/landing/FeaturedReads";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PinnedManifesto } from "@/components/landing/PinnedManifesto";
import { Button } from "@/components/ui/button";
import { MANIFESTO } from "@/lib/manifesto";

export default async function Home() {
  return (
    <main className="flex-1">
      {/* HERO — editorial asymmetric layout */}
      <section className="relative overflow-hidden">
        {/* Background washes */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        />

        <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.3fr_1fr] md:items-center md:py-24">
          {/* Left — copy */}
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Per-paragraph cUSD micro-tipping
            </span>

            <h1 className="font-serif text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
              <span className="block text-foreground">Reward</span>
              <span className="block italic text-primary">
                <TypewriterTagline />
              </span>
            </h1>

            <p className="max-w-lg text-base text-muted-foreground md:text-lg">
              TipiTip turns articles into something tippable. Readers tap a
              heart under any paragraph and instantly send the author a small
              cUSD micro-tip — no subscriptions, no middlemen.
            </p>

            {/* Two CTAs by audience:
                 - "Start writing" is the writer's path (any visitor
                   can land on /write; the page itself prompts wallet
                   connection there)
                 - "Read a piece" sends new readers straight to the
                   pinned manifesto so they meet a real article with
                   a real tip surface before being asked to connect.
                 The previous "Open dashboard" CTA was a dead end for
                 anyone who hadn't connected yet — an empty page. */}
            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <Button asChild size="lg" className="shadow-sm shadow-primary/20">
                <Link href="/write">
                  <PenLine className="mr-2 h-4 w-4" />
                  Start writing
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/a/${MANIFESTO.articleId}`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read a piece
                </Link>
              </Button>
            </div>
          </div>

          {/* Right — animated heart */}
          <div className="relative flex items-center justify-center">
            {/* Soft glow under the heart */}
            <div
              aria-hidden="true"
              className="absolute h-64 w-64 rounded-full bg-primary/20 blur-3xl"
            />
            <FloatingHeart />
          </div>
        </div>
      </section>

      {/* PINNED MANIFESTO — featured "from the creator" slot. Placed
          right after the hero so a first-time reader meets the
          editorial voice (and a real tippable article) before being
          asked to understand the mechanics or scan a feed. */}
      <PinnedManifesto />

      {/* HOW IT WORKS — concrete two-column walkthrough (writer /
          reader). Sits between the manifesto (why) and the sample
          paragraph (what reading feels like) so the mechanics are
          explained before the demo. */}
      <HowItWorks />

      {/* SAMPLE PARAGRAPHS — a tiny editorial demo of what a tippable
          paragraph reads like in practice. Now lives after the
          how-it-works walkthrough so the reader has the vocabulary
          ("approve once, tap to tip") to recognise the gesture in the
          last paragraph. Section sits on the same uniform body
          background as every other landing section. */}
      <section>
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <RevealOnScroll>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              from a sample article
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.05}>
            <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
              <span className="text-foreground">On the small dignity of</span>{" "}
              <span className="italic text-primary">a paid paragraph.</span>
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.12}>
            <p className="mt-6 text-lg leading-relaxed text-foreground/85">
              A subscription is a permanent shrug — it says &ldquo;here is some
              money, hope you write something good this month.&rdquo; A
              per-paragraph tip is a specific gesture. It says &ldquo;this
              line, right here, made me stop.&rdquo;
              <Heart
                aria-hidden="true"
                className="ml-1 inline-block h-4 w-4 fill-primary text-primary align-text-bottom"
              />
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Sub-cent gas on Celo. Pre-approve once and every subsequent tap
              is one transaction. MiniPay readers never see a wallet popup —
              they just tap, and the writer&apos;s balance grows.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* LATEST ARTICLES — pulled from on-chain ArticleRegistered
          events. Sits at the bottom so the page ends on "pick
          something to read" rather than a static walkthrough. */}
      <FeaturedReads />
    </main>
  );
}

import Link from "next/link";
import { BookOpen, PenLine } from "lucide-react";

import { HeroDemo } from "@/components/hero/HeroDemo";
import { LedgerSection } from "@/components/landing/LedgerSection";
import { WhyTipiTip } from "@/components/landing/WhyTipiTip";
import { Button } from "@/components/ui/button";
import { getLeaderboard } from "@/lib/leaderboard";
import { MANIFESTO } from "@/lib/manifesto";

const STEPS = [
  {
    n: "01",
    title: "Publish in a minute",
    body: "Paste markdown, hit publish. Your piece is live with a tip target under every paragraph.",
  },
  {
    n: "02",
    title: "Readers tap to tip",
    body: "A tap under any paragraph sends an instant cUSD micro-tip straight from a MiniPay wallet.",
  },
  {
    n: "03",
    title: "cUSD lands on-chain",
    body: "No payout minimums, no middlemen. The tip settles to your address on Celo in about a second.",
  },
];

export default async function Home() {
  const board = await getLeaderboard();

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
        {/* registration / crop marks - machine-print detail */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-5 hidden md:block">
          <span className="absolute left-0 top-0 h-3.5 w-3.5 border-l border-t border-primary/40" />
          <span className="absolute right-0 top-0 h-3.5 w-3.5 border-r border-t border-primary/40" />
          <span className="absolute bottom-0 left-0 h-3.5 w-3.5 border-b border-l border-primary/40" />
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 border-b border-r border-primary/40" />
        </div>

        <div className="container relative mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-24">
          {/* Left — copy */}
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              <span aria-hidden="true">¶</span>
              Per-paragraph cUSD micro-tipping
            </span>

            {/* clamp() keeps the longest line inside a 390 px mobile
                viewport without overflow; desktop tops out around 72 px. */}
            <h1
              className="font-bold leading-[0.95] tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 8vw + 0.5rem, 4.5rem)" }}
            >
              <span className="block text-foreground">Reward</span>
              <span className="block text-foreground">
                real <span className="italic text-primary">voices.</span>
              </span>
            </h1>

            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              TipiTip turns any article into something tippable. Readers tap a
              paragraph and instantly send the author a small cUSD micro-tip.
              No subscriptions, no middlemen.
            </p>

            {/* Two CTAs by audience: "Start writing" is the writer's
                path; "Read a piece" sends new readers straight to the
                pinned manifesto so they meet a real tippable article. */}
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

            {/* Traction. Static for now (verifiable on Celoscan); a
                follow-up can wire these to the on-chain aggregation. */}
            <dl className="flex gap-8 border-t border-dashed pt-6">
              <div>
                <dt className="font-mono text-2xl font-semibold tabular-nums text-foreground">10,725</dt>
                <dd className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">cUSD tipped</dd>
              </div>
              <div>
                <dt className="font-mono text-2xl font-semibold tabular-nums text-foreground">760+</dt>
                <dd className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">supporters</dd>
              </div>
              <div>
                <dt className="font-mono text-2xl font-semibold tabular-nums text-foreground">12,381</dt>
                <dd className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">on-chain tips</dd>
              </div>
            </dl>
          </div>

          {/* Right - tippable-article demo */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-3xl"
            />
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — three steps */}
      <section className="border-t">
        <div className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            <span aria-hidden="true">¶</span> How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Three taps from draft to paid.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="border-t-2 border-foreground pt-5">
                <div className="font-mono text-xs font-semibold tracking-[0.1em] text-primary">
                  {s.n}
                </div>
                <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY TIPITIP — three cards */}
      <WhyTipiTip />

      {/* THIS WEEK'S LEDGER — real most-tipped paragraphs */}
      <LedgerSection paragraphs={board.topParagraphs.slice(0, 4)} />

      {/* CTA BAND */}
      <section className="border-t">
        <div className="container mx-auto max-w-3xl px-4 py-20 text-center md:py-24">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            <span aria-hidden="true">¶</span> Start earning today
          </p>
          <h2 className="mx-auto mt-3 max-w-xl text-4xl font-bold tracking-tight md:text-5xl">
            Your next paragraph is worth something.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Publish in a minute. Get paid per paragraph, in real cUSD.
          </p>
          <div className="mt-7 flex justify-center">
            <Button asChild size="lg" className="shadow-sm shadow-primary/20">
              <Link href="/write">
                <PenLine className="mr-2 h-4 w-4" />
                Start writing
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

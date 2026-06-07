import Link from "next/link";
import { BookOpen, PenLine } from "lucide-react";
import { formatUnits } from "viem";

import { CountUp } from "@/components/count-up";
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
      {/* HERO — editorial asymmetric layout, flat background (matches the mockup) */}
      <section>
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-[3.375rem] md:pb-16 md:pt-[4.5rem]">
          {/* Left — copy */}
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              <span aria-hidden="true">¶</span>
              Per-paragraph cUSD micro-tipping
            </span>

            {/* clamp() keeps the longest line inside a 390 px mobile
                viewport without overflow; desktop caps at 62 px (mockup). */}
            <h1
              className="font-bold leading-[0.95] tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 8vw + 0.5rem, 3.875rem)" }}
            >
              <span className="block text-foreground">Reward</span>
              <span className="block text-foreground">
                real <span className="italic text-primary">voices.</span>
              </span>
            </h1>

            <p className="max-w-[34ch] text-[17px] leading-relaxed text-muted-foreground">
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

            {/* Live traction, from the same full-history scan that feeds the
                ledger below (hidden until there is on-chain data, so an RPC
                hiccup never renders zeros). */}
            {board.totals.tips > 0 && (
              <dl className="flex gap-8 border-t border-dashed pt-6">
                <div>
                  <dt className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                    <CountUp
                      value={Number(formatUnits(BigInt(board.totals.tipped), 18))}
                      decimals={2}
                    />
                  </dt>
                  <dd className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">cUSD tipped</dd>
                </div>
                <div>
                  <dt className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                    <CountUp value={board.totals.supporters} />
                  </dt>
                  <dd className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">supporters</dd>
                </div>
                <div>
                  <dt className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                    <CountUp value={board.totals.tips} />
                  </dt>
                  <dd className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">on-chain tips</dd>
                </div>
              </dl>
            )}
          </div>

          {/* Right - tippable-article demo */}
          <div>
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

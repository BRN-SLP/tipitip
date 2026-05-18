import { RevealOnScroll } from "@/components/hero/RevealOnScroll";

/**
 * Editorial how-it-works summary, sitting at the bottom of the landing.
 *
 * Replaces a heavier persona-tabbed walkthrough that auto-advanced
 * through eight mock steps with terminal-style captions. The earlier
 * version was technically impressive but visually competed with every
 * other block on the page (hero, sample paragraph, pinned manifesto,
 * Latest grid) — by the time a visitor scrolled this far, another
 * interactive widget read as noise, not value.
 *
 * The product itself is one paragraph long ("tap a heart, money flows
 * to the author") so the explanation can be one paragraph long too.
 * Two short columns, each four lines, side by side. No icons, no
 * cards, no animation. Just typography doing the work — same register
 * as the editorial sections above.
 */
export function HowItWorks() {
  return (
    <section
      className="container mx-auto max-w-5xl px-4 py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mb-10 max-w-2xl">
        <RevealOnScroll>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            How it works
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={0.05}>
          <h2
            id="how-it-works-heading"
            className="font-serif text-3xl font-semibold leading-tight md:text-4xl"
          >
            <span className="text-foreground">Two flows,</span>{" "}
            <span className="italic text-primary">one contract.</span>
          </h2>
        </RevealOnScroll>
      </div>

      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        {/* WRITERS */}
        <RevealOnScroll delay={0.12}>
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              Writers
            </p>
            <ul className="space-y-3 text-base leading-relaxed text-foreground/85">
              <li>
                Write in markdown, click publish, sign one transaction.
              </li>
              <li>
                Your article body is content-addressed by a keccak256
                hash, so future edits do not break existing tips.
              </li>
              <li>
                Tips accumulate inside the contract. No off-chain
                bookkeeping, no minimum payout.
              </li>
              <li>
                Sweep everything to your wallet whenever, in one
                transfer. Gas is sub-cent on Celo.
              </li>
            </ul>
          </div>
        </RevealOnScroll>

        {/* READERS */}
        <RevealOnScroll delay={0.18}>
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              Readers
            </p>
            <ul className="space-y-3 text-base leading-relaxed text-foreground/85">
              <li>
                Connect a Celo wallet. MiniPay is auto-detected, no
                popup, no friction.
              </li>
              <li>
                Approve a cUSD allowance once. Every future tap becomes
                a single transaction.
              </li>
              <li>
                Tap the heart under the paragraph that made you stop.
                The micro-tip lands in the same block.
              </li>
              <li>
                The counter under each paragraph updates live, so you
                can see what other readers loved.
              </li>
            </ul>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

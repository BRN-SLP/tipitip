import { CircleDollarSign, Pilcrow, Sprout } from "lucide-react";

import { RevealOnScroll } from "@/components/hero/RevealOnScroll";

const CARDS = [
  {
    Icon: Pilcrow,
    title: "Priced per paragraph",
    body: "The atomic unit of writing finally has a price. Reward the exact line that moved you, not a faceless subscription.",
  },
  {
    Icon: CircleDollarSign,
    title: "Instant cUSD, real money",
    body: "Stablecoin tips settle on Celo in about a second, with sub-cent gas. MiniPay-ready for 14M+ wallets worldwide.",
  },
  {
    Icon: Sprout,
    title: "Sustainable, not extractive",
    body: "Most of every tip is the author's. A small 2.5% protocol fee funds development and a writer prize pool.",
  },
];

export function WhyTipiTip() {
  return (
    <section className="border-t">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-20">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
          <span aria-hidden="true">¶</span> Why TipiTip
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          A machine that pays writers, one paragraph at a time.
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Built like a printing press for the value of words: precise,
          mechanical, and fair down to a tenth of a cent.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {CARDS.map(({ Icon, title, body }, i) => (
            <RevealOnScroll key={title} delay={i * 0.06}>
              <div className="group relative h-full overflow-hidden rounded-2xl border bg-card p-6 transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-[3px] w-12 bg-primary"
                />
                <Icon
                  className="mb-4 h-9 w-9 text-foreground"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

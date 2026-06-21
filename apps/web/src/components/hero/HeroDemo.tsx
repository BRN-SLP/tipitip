import { Heart } from "lucide-react";

/**
 * Hero demo card - a stylised "tippable article" window with a live
 * paragraph and a tip receipt. Static, decorative; the numbers mirror
 * the real protocol fee (2.5%) so the maths stays honest.
 */
export function HeroDemo() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_24px_60px_-34px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:-translate-y-0.5">
      {/* window header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </span>
        <span className="font-mono text-[11px] tracking-wide text-muted-foreground">
          a-parking-meter-for-paragraphs.md
        </span>
      </div>

      {/* article body */}
      <div className="space-y-3.5 px-5 py-5">
        <p className="text-[14.5px] leading-relaxed text-foreground">
          A paragraph is the smallest unit of a finished thought. So why do we
          only ever pay for the whole article?
        </p>
        <p className="relative border-l-2 border-primary pl-4 text-[14.5px] leading-relaxed text-foreground">
          <span
            aria-hidden="true"
            className="absolute -left-[7px] -top-0.5 text-primary"
          >
            ¶
          </span>
          This one landed. A reader tapped it, and value moved before you
          finished reading the next line.
        </p>
      </div>

      {/* tap bar */}
      <div className="flex items-center gap-3 border-t border-dashed bg-secondary/60 px-5 py-3.5">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_hsl(var(--primary))]">
          <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          readers tap a paragraph to tip
        </span>
        <span className="ml-auto font-mono text-sm font-semibold text-primary">
          +$0.010
        </span>
      </div>

      {/* receipt */}
      <div className="mx-5 mb-5 mt-3.5 rounded-xl border border-dashed px-3.5 py-3 font-mono text-[11.5px] text-muted-foreground">
        <div className="flex justify-between py-0.5">
          <span>TIP RECEIPT</span>
          <span>celo mainnet</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span>amount</span>
          <b className="font-semibold text-foreground">0.010 cUSD</b>
        </div>
        <div className="flex justify-between py-0.5">
          <span>to author</span>
          <b className="font-semibold text-foreground">0.00975 cUSD</b>
        </div>
        <div className="mt-2 flex justify-between border-t border-dashed pt-2">
          <span>protocol fee 2.5%</span>
          <span>~$0.0003 gas</span>
        </div>
      </div>
    </div>
  );
}
// @a11y: img role
// @perf: lazy-load candidate
// @i18n: extract pluralization logic
// @type: narrow the generic constraint
// @cleanup: remove unused import on refactor
// @todo: handle retryable errors

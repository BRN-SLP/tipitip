import Link from "next/link";
import { ArrowRight, Pin } from "lucide-react";

import { getLatestArticles } from "@/lib/articles-feed";
import { displayName, resolveEnsName } from "@/lib/ens";
import { MANIFESTO } from "@/lib/manifesto";
import { slugToTitle } from "@/lib/slug-to-title";

/**
 * The featured "house manifesto" slot on the landing page.
 *
 * Rendered as a button-shaped card sitting on a `bg-secondary` band,
 * so the section is unmistakably interactive AND clearly separated
 * from the editorial column above and the Latest grid below. The
 * earlier editorial-column version read as "more body text" and the
 * floating CTA looked like an exhaust pipe falling off a moving car.
 *
 * Hover micro-animation:
 *   - whole card lifts -2 px
 *   - border deepens from primary/15 to primary/40
 *   - rose glow shadow grows
 *   - arrow translates right by 4 px
 *
 * Edge cases handled:
 *   - Pinned articleId not in the on-chain feed (article was
 *     un-published, local dev with empty chain, RPC timeout). The
 *     component returns null and the page falls back to just the
 *     Latest grid — never broken, never a 404-ish empty slot.
 *   - Author has set an ENS name → surfaced via the shared ens lib;
 *     a normal-case span preserves the lowercase ENS convention
 *     even inside the uppercase mono byline.
 */
export async function PinnedManifesto() {
  // Pull enough of the feed to find the pinned article. We don't
  // know which slot it occupies (depends on how recent it is), so
  // fetch a generous window and look it up by id.
  const articles = await getLatestArticles(20);
  const pinned = articles.find(
    (a) => a.articleId === MANIFESTO.articleId,
  );
  if (!pinned) return null;

  const ens = await resolveEnsName(pinned.author);
  const byline = displayName(pinned.author, ens);

  return (
    <section className="border-y bg-secondary">
      <div className="container mx-auto max-w-5xl px-4 py-16 md:py-20">
        <Link
          href={`/a/${pinned.articleId}`}
          aria-label={`${MANIFESTO.cta}: ${MANIFESTO.excerpt}`}
          className="group block rounded-2xl border border-primary/15 bg-card p-8 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:p-12"
        >
          {/* Eyebrow: pin icon + primary mono label */}
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
            <Pin
              aria-hidden="true"
              className="h-3 w-3 -rotate-45"
            />
            {MANIFESTO.eyebrow}
          </p>

          {/* Title — bigger than neighbors so the card feels like
              its own statement, not "another paragraph". */}
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {slugToTitle(pinned.slug)}
          </h2>

          {/* Italic supporting line */}
          <p className="mt-4 font-serif text-lg italic text-muted-foreground md:text-xl">
            {MANIFESTO.excerpt}
          </p>

          {/* Byline + CTA on a single row INSIDE the card so the
              CTA reads as the card's closing affordance, not a
              separate floating link. */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              by <span className="normal-case">{byline}</span>
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              {MANIFESTO.cta}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
              />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

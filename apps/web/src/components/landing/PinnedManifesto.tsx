import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getLatestArticles } from "@/lib/articles-feed";
import { displayName, resolveEnsName } from "@/lib/ens";
import { MANIFESTO } from "@/lib/manifesto";
import { slugToTitle } from "@/lib/slug-to-title";

/**
 * The featured "house manifesto" slot on the landing page.
 *
 * Rendered as an editorial column — same width and typographic
 * rhythm as the sample-paragraph block above it on the landing, so
 * the page reads as a sequence of editorial columns (sample, pinned)
 * flanking the hero and the Latest grid. Distinguished from the
 * sample by a primary-coloured eyebrow ("Pinned · House manifesto"
 * vs. the muted "From a sample article") — the colour tells the
 * reader "this one is real, not a demo".
 *
 * Deliberately NOT a card. Card chrome on a single solo element
 * between two card-free sections reads as an ad banner; pure
 * typography on the page background reads as content.
 *
 * Edge cases handled:
 *   - Pinned articleId not in the on-chain feed (article was
 *     un-published, local dev with empty chain, RPC timeout). The
 *     component returns null and the page falls back to just the
 *     Latest grid — never broken, never a 404-ish empty slot.
 *   - Author has set an ENS name → surfaced via the shared ens lib.
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
    <section className="border-t bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        {/* Eyebrow — same font-mono uppercase tracking as the
            sample-paragraph block, but in primary color so the
            two columns are distinguishable at a glance. */}
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          Pinned · {MANIFESTO.eyebrow.replace(/^.*?·\s*/, "")}
        </p>

        {/* Title — serif, mirrors the sample paragraph block's
            heading scale exactly. */}
        <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
          {slugToTitle(pinned.slug)}
        </h2>

        {/* Italic supporting line — same italic-primary treatment
            the hero and sample block use for "the line that
            landed". */}
        <p className="mt-4 font-serif text-lg italic text-muted-foreground md:text-xl">
          {MANIFESTO.excerpt}
        </p>

        {/* Byline + CTA on a single row — keeps the column tight
            and tells the reader "this is a real article by a real
            author, not a marketing slot". */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            by {byline}
          </p>
          <Link
            href={`/a/${pinned.articleId}`}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={`${MANIFESTO.cta}: ${MANIFESTO.excerpt}`}
          >
            <span>{MANIFESTO.cta}</span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}


import Link from "next/link";
import { ArrowRight, Pin } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { getLatestArticles } from "@/lib/articles-feed";
import { displayName, resolveEnsName } from "@/lib/ens";
import { MANIFESTO } from "@/lib/manifesto";
import { slugToTitle } from "@/lib/slug-to-title";

/**
 * The featured "house manifesto" slot on the landing page.
 *
 * Rendered as a shadcn `<Card>` — the same component the Latest grid
 * uses — so the visual language stays consistent across the page on
 * one uniform background. What sets the pinned slot apart from a
 * regular Latest card:
 *
 *   1. Wider container (max-w-3xl) and roomier padding.
 *   2. Pin icon + primary-coloured "PINNED · HOUSE MANIFESTO" eyebrow.
 *   3. A heartbeat-pulsing rose glow behind the card (CSS
 *      `animate-heartbeat` defined in globals.css). Subtle — base
 *      opacity 0.18, peak 0.45, double-pulse rhythm at 2.6 s. Reads
 *      as ambience, not as a flashing badge. Respects
 *      prefers-reduced-motion.
 *
 * Edge cases:
 *   - Pinned articleId not in the on-chain feed → component returns
 *     null, page falls back to just the Latest grid.
 *   - Author has set an ENS name → surfaced via the shared ens lib;
 *     a normal-case span preserves the lowercase ENS convention even
 *     inside the uppercase mono byline.
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
    <section className="bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <Link
          href={`/a/${pinned.articleId}`}
          aria-label={`${MANIFESTO.cta}: ${MANIFESTO.excerpt}`}
          className="group relative block focus-visible:outline-none"
        >
          {/* Heartbeat glow — soft rose halo behind the card.
              Inset slightly larger than the card so the bloom spills
              past the corners; pointer-events-none so the card itself
              receives the click. */}
          <div
            aria-hidden="true"
            className="animate-heartbeat pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-primary/25 blur-3xl"
          />

          <Card className="transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-md group-hover:shadow-primary/10 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2">
            <CardHeader className="space-y-4 p-6 md:p-10">
              {/* Eyebrow: pin icon + primary mono label */}
              <p className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                <Pin
                  aria-hidden="true"
                  className="h-3 w-3 -rotate-45"
                />
                {MANIFESTO.eyebrow}
              </p>

              {/* Title — same class as every other section h2 on the
                  landing (sample, latest, how-it-works). */}
              <h2 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
                {slugToTitle(pinned.slug)}
              </h2>

              {/* Italic supporting line */}
              <p className="font-serif text-lg italic text-muted-foreground md:text-xl">
                {MANIFESTO.excerpt}
              </p>
            </CardHeader>

            <CardContent className="p-6 pt-0 md:p-10 md:pt-0">
              {/* Byline + CTA on a single row, separated from the
                  body by a thin border-t. */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-5">
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
            </CardContent>
          </Card>
        </Link>
      </div>
    </section>
  );
}

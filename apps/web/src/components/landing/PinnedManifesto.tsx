import Link from "next/link";
import { ArrowRight, Pin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getLatestArticles } from "@/lib/articles-feed";
import { displayName, resolveEnsName } from "@/lib/ens";
import { MANIFESTO } from "@/lib/manifesto";

/**
 * The featured "founder's manifesto" slot on the landing page.
 *
 * Renders a single wide card above the regular Latest grid that
 * advertises the pinned article (configured in `lib/manifesto.ts`).
 * Visually distinct from the grid below — wider, left-aligned, with
 * an eyebrow label, italic teaser, and a primary-coloured CTA — so
 * that it reads as "start here" rather than "another item in a list."
 *
 * Edge cases handled:
 *   - The pinned articleId is not in the on-chain feed (article was
 *     un-published, local dev with empty chain, RPC timeout). The
 *     component returns null and the page falls back to just the
 *     Latest grid — never broken, never a 404-ish empty card.
 *   - The author has set an ENS name — surfaced via the shared
 *     ens lib, same way the Latest grid does it.
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
      <div className="container mx-auto max-w-5xl px-4 pt-20">
        <Link
          href={`/a/${pinned.articleId}`}
          className="group block focus-visible:outline-none"
          aria-label={`${MANIFESTO.cta}: ${MANIFESTO.excerpt}`}
        >
          <Card className="relative overflow-hidden border-l-2 border-l-primary/60 bg-primary/[0.025] transition group-hover:bg-primary/[0.05] group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2">
            {/* Subtle radial highlight in the top-right corner —
                gives the card depth without using a hard background. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
            />

            <CardContent className="relative grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-end md:p-10">
              <div className="space-y-3">
                <p className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
                  <Pin
                    aria-hidden="true"
                    className="h-3 w-3 -rotate-45"
                  />
                  {MANIFESTO.eyebrow}
                </p>
                <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                  {slugToTitle(pinned.slug)}
                </h2>
                <p className="font-serif text-lg italic text-muted-foreground md:text-xl">
                  {MANIFESTO.excerpt}
                </p>
                <p className="pt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  by {byline}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-primary md:self-center">
                <span>{MANIFESTO.cta}</span>
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </section>
  );
}

/** Mirror of FeaturedReads.slugToTitle so the two components agree. */
function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { RevealOnScroll } from "@/components/hero/RevealOnScroll";
import { Button } from "@/components/ui/button";
import { SHOWCASE_SITES } from "@/lib/showcase";

export const metadata: Metadata = {
  title: "Powered by TipiTip — sites tipping by the paragraph",
  description:
    "Blogs and publications that let readers tip per paragraph in cUSD with the @tipitip/embed SDK. Add your site in two lines.",
};

const EMBED_SNIPPET = `import { TipParagraphs } from "@tipitip/embed";

<TipParagraphs articleId="0x..." />`;

export default function ShowcasePage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-16">
      <RevealOnScroll>
        <PageHeader
          eyebrow="Powered by TipiTip"
          title="Sites tipping by the paragraph"
          subtitle={
            <>
              The <code className="font-mono text-sm">@tipitip/embed</code> SDK
              turns any blog into a tip surface: readers reward the exact line
              that landed, in sub-cent cUSD on Celo. Here is who is using it.
            </>
          }
        />
      </RevealOnScroll>

      <RevealOnScroll delay={0.06}>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {SHOWCASE_SITES.map((site) => {
            const inner = (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{site.name}</span>
                  {site.external && (
                    <ExternalLink
                      className="h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {site.description}
                </p>
              </>
            );
            const cls =
              "block rounded-lg border border-border bg-card/40 p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0";
            return (
              <li key={site.name}>
                {site.external ? (
                  <a
                    href={site.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={cls}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link href={site.href} className={cls}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </RevealOnScroll>

      <RevealOnScroll delay={0.1}>
        <section className="mt-14 rounded-xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6 md:p-8">
          <h2 className="font-serif text-2xl font-semibold">Add your site</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Two lines drop tippable paragraphs into your blog, docs page or
            Farcaster frame. Once it is live, open a PR or ping us to get listed
            here.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-md border border-border/80 bg-background/80 p-4 font-mono text-[13px] leading-relaxed text-foreground/85">
            {EMBED_SNIPPET}
          </pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/embed">
                Embed docs <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/for-writers">For writers</Link>
            </Button>
          </div>
        </section>
      </RevealOnScroll>
    </main>
  );
}
// @guard: sanitize user input here
// @cleanup: remove unused import on refactor
// @a11y: verify screen-reader announcement
// @i18n: extract pluralization logic
// @a11y: focus management on route change
// @note: coordinated with PR #87
// @config: make this configurable via env
// @guard: rate limit this operation

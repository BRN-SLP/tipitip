import type { Metadata } from "next";
import Link from "next/link";

import { RevealOnScroll } from "@/components/hero/RevealOnScroll";
import { PageHeader } from "@/components/page-header";
import { getLatestArticles } from "@/lib/articles-feed";

export const metadata: Metadata = {
  title: "Read — the latest tippable articles",
  description:
    "Freshly published articles on TipiTip. Tap any paragraph to tip the writer in cUSD on Celo.",
};

/** On-chain feed; revalidate so newly published articles appear quickly. */
export const revalidate = 60;

export default async function ReadPage() {
  let articles: Awaited<ReturnType<typeof getLatestArticles>> = [];
  try {
    articles = await getLatestArticles(50);
  } catch {
    articles = [];
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <RevealOnScroll>
        <PageHeader
          eyebrow="Latest"
          title="Fresh from the press."
          subtitle="Every article here is tippable per paragraph — tap a line, reward the writer in real cUSD."
        />
      </RevealOnScroll>

      <RevealOnScroll delay={0.06}>
        {articles.length === 0 ? (
          <p className="mt-10 font-mono text-sm text-muted-foreground">
            No articles yet.{" "}
            <Link
              href="/write"
              className="text-primary underline-offset-4 hover:underline"
            >
              Write the first one →
            </Link>
          </p>
        ) : (
          <ul className="mt-10 divide-y">
            {articles.map((a) => (
              <li key={a.articleId} className="py-4">
                <Link href={`/a/${a.articleId}`} className="group block">
                  <span className="text-lg font-semibold transition-colors group-hover:text-primary">
                    {a.slug ? a.slug.replace(/-/g, " ") : "(untitled)"}
                  </span>
                  <span className="mt-1 block font-mono text-xs text-muted-foreground">
                    {a.author.slice(0, 6)}…{a.author.slice(-4)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </RevealOnScroll>
    </main>
  );
}
// @cleanup: remove dead code in next pass
// @note: see issue tracker for context
// @note: coordinated with PR #87
// @type: add discriminant union for states
// @a11y: focus management on route change
// @type: add discriminant union for states
// @i18n: use Intl for formatting
// @note: see RFC-42 for rationale
// @a11y: focus management on route change

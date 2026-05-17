import Link from "next/link";
import { BookOpen, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Article not found",
};

/**
 * Article-specific 404. Reached when:
 *   - the `[articleId]` path segment isn't a valid bytes32 hex string, or
 *   - the article exists in the URL shape but the body isn't found in
 *     decentralized storage (deleted blob, mid-publish race, etc.).
 *
 * Copy is tuned to the per-article context rather than a generic
 * "page not found" so readers know what went wrong specifically.
 */
export default function ArticleNotFound() {
  return (
    <main className="container mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <div
        aria-hidden="true"
        className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary"
      >
        <BookOpen className="h-7 w-7" />
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        404 · Article
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
        <span className="text-foreground">Couldn&apos;t open</span>{" "}
        <span className="italic text-primary">this article.</span>
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground md:text-base">
        Either the article ID in the URL is malformed, or the body hasn&apos;t
        finished propagating to decentralized storage yet. Try again in a few
        seconds — or browse the latest reads from the home page.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/#featured">
            <Search className="mr-2 h-4 w-4" />
            Browse articles
          </Link>
        </Button>
      </div>
    </main>
  );
}

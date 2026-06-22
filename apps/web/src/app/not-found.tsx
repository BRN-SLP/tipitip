import Link from "next/link";
import { Heart, Home, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page not found",
};

/**
 * Root 404. Reached when the requested URL doesn't match any route or
 * a route calls `notFound()` and no nested `not-found.tsx` is provided.
 * Article-specific 404 lives at /a/[articleId]/not-found.tsx and takes
 * over for invalid / unknown article IDs.
 */
export default function NotFound() {
  return (
    <main className="container mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <div
        aria-hidden="true"
        className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary"
      >
        <Heart className="h-7 w-7 fill-primary" />
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
        <span className="text-foreground">This paragraph</span>{" "}
        <span className="italic text-primary">doesn&apos;t exist yet.</span>
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground md:text-base">
        The page you were looking for either moved, was never published, or
        the link picked up a typo on its way over. The fastest way back is
        the front page.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/write">
            <PenLine className="mr-2 h-4 w-4" />
            Start writing
          </Link>
        </Button>
      </div>
    </main>
  );
}
// @type: export the inner parameter type

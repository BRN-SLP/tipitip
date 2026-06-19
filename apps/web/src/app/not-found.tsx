import Link from "next/link";
import { Heart, Home, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export async function generateMetadata() {
  const t = await getTranslations("notFound");
  return { title: t("metaTitle") };
}

/**
 * Root 404. Reached when the requested URL doesn't match any route or
 * a route calls `notFound()` and no nested `not-found.tsx` is provided.
 * Article-specific 404 lives at /a/[articleId]/not-found.tsx and takes
 * over for invalid / unknown article IDs.
 */
export default function NotFound() {
  const t = useTranslations("notFound");
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
        <span className="text-foreground">{t("title1")}</span>{" "}
        <span className="italic text-primary">{t("titleAccent")}</span>
      </h1>
      <p className="mt-4 max-w-md text-sm text-muted-foreground md:text-base">
        {t("body")}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            {t("home")}
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/write">
            <PenLine className="mr-2 h-4 w-4" />
            {t("write")}
          </Link>
        </Button>
      </div>
    </main>
  );
}

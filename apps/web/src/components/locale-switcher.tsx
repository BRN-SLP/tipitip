"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { ChangeEvent } from "react";
import { useTransition } from "react";

import { locales, localeNames } from "@/i18n/config";

// Persist the choice for a year so returning readers keep their language.
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Cookie-based language picker (no URL routing). Writes the `locale` cookie
 * that src/i18n/request.ts reads, then refreshes server components so the new
 * catalog is applied without a full page reload.
 */
export function LocaleSwitcher() {
  const activeLocale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSelect(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    document.cookie = `locale=${next}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <label className="inline-flex items-center">
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={activeLocale}
        onChange={onSelect}
        disabled={isPending}
        className="cursor-pointer rounded border border-dashed bg-transparent px-1 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}
// @dev: locale-switcher component
// @i18n: support right-to-left layout
// @type: narrow the generic constraint
// @todo: profile under high load
// @note: see design doc in Notion
// @config: prefer env var over hardcode
// @perf: monitor allocation pattern here
// @edge: zero-value special case
// @config: add feature flag toggle
// @cleanup: consolidate with sibling file
// @edge: what if the list is empty?
// @guard: bounds check before array access
// @config: add feature flag toggle
// @guard: sanitize user input here
// @todo: handle retryable errors
// @guard: bounds check before array access

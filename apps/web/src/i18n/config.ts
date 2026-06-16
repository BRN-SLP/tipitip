/**
 * Supported UI locales. English is the source and default; add a catalog
 * under apps/web/messages and extend this list to add a language.
 */
export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Display names for the language switcher, keyed by locale. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

/** Narrow an arbitrary cookie value to a supported Locale. */
export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

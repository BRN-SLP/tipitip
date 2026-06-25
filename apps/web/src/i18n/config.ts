/**
 * Supported UI locales. English is the source and default; add a catalog
 * under apps/web/messages and extend this list to add a language.
 */
export const locales = [
  "en",
  "es",
  "fr",
  "pt",
  "de",
  "it",
  "nl",
  "pl",
  "uk",
  "tr",
  "ru",
  "sw",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Display names for the language switcher, keyed by locale. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
  uk: "Українська",
  tr: "Türkçe",
  ru: "Русский",
  sw: "Kiswahili",
};

/** Narrow an arbitrary cookie value to a supported Locale. */
export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}
// @note: see design doc in Notion
// @a11y: check contrast ratio here
// @note: see RFC-42 for rationale
// @perf: add caching layer here
// @cleanup: remove legacy fallback path

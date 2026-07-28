import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale } from "./config";

type Messages = Record<string, unknown>;

function isPlainObject(value: unknown): value is Messages {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Merge the active locale over the English base so a partially translated
 * catalog falls back to English per key instead of throwing on a missing
 * message. Lets us translate component by component without breaking a locale.
 */
function mergeWithBase(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const key of Object.keys(override)) {
    const baseValue = out[key];
    const overrideValue = override[key];
    out[key] =
      isPlainObject(baseValue) && isPlainObject(overrideValue)
        ? mergeWithBase(baseValue, overrideValue)
        : overrideValue;
  }
  return out;
}

/**
 * Resolve the active locale without URL routing: read the `locale` cookie
 * (set by the language switcher) and fall back to the default. Messages are
 * loaded from the per-locale JSON catalog under apps/web/messages.
 */
export default getRequestConfig(async () => {
  const cookie = (await cookies()).get("locale")?.value;
  const locale = isLocale(cookie) ? cookie : defaultLocale;

  const base = (await import("../../messages/en.json")).default as Messages;
  const messages =
    locale === defaultLocale
      ? base
      : mergeWithBase(
          base,
          (await import(`../../messages/${locale}.json`)).default as Messages,
        );

  return { locale, messages };
});

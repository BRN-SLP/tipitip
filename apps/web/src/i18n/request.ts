import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale } from "./config";

/**
 * Resolve the active locale without URL routing: read the `locale` cookie
 * (set by the language switcher) and fall back to the default. Messages are
 * loaded from the per-locale JSON catalog under apps/web/messages.
 */
export default getRequestConfig(async () => {
  const cookie = (await cookies()).get("locale")?.value;
  const locale = isLocale(cookie) ? cookie : defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});

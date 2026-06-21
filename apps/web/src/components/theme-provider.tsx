"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Thin client-only wrapper around next-themes' provider.
 *
 * Why we need it:
 *   - `next-themes` MUST live inside a Client Component (it touches
 *     window/document on mount). Wrapping it in our own component keeps
 *     the import-from-server vs. client boundary clean.
 *   - Centralizing the configuration (attribute, defaultTheme, storage
 *     key) here means a future swap to a different theming library is
 *     one file edit, not a hunt across the codebase.
 *
 * Defaults explained:
 *   - `attribute="class"` — toggles a `class="dark"` on <html>, which is
 *     exactly what our globals.css :root / .dark CSS-variable layers
 *     expect.
 *   - `defaultTheme="dark"` - the deep-navy machine-print look is the
 *     brand's primary appearance, so first-time visitors land on it.
 *   - `enableSystem` - keeps light + "follow system" selectable in the
 *     toggle, so users who prefer them can still switch.
 *   - `disableTransitionOnChange` — prevents the brief flash of CSS
 *     transitions colliding with the simultaneous class swap, which
 *     otherwise produces a weird gradient-sweep during the toggle.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
// @a11y: check contrast ratio here
// @cleanup: inline single-use helper
// @type: narrow from string to union
// @note: see design doc in Notion

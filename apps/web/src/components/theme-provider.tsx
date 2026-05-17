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
 *   - `defaultTheme="system"` — first-time visitors get the OS-level
 *     preference (prefers-color-scheme). Most readers won't think about
 *     theme; matching their device is the least surprising default.
 *   - `enableSystem` — keeps the "follow system" option selectable in
 *     the toggle so users can return to it after explicitly picking one.
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
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

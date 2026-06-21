"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * App-wide toast surface. Mounted once in app/layout.tsx; toast
 * messages are emitted from anywhere via `import { toast } from "sonner"`.
 *
 * Brand tuning:
 *   - top-right placement keeps the heart-tipping flow uninterrupted
 *     in the article body.
 *   - 'rich-colors' applies success/error tints derived from the
 *     CSS theme variables, so toasts inherit our rose/cream palette
 *     on light and rose/navy on dark.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "font-sans rounded-lg border border-border bg-background text-foreground shadow-lg",
          title: "font-serif text-sm font-semibold",
          description: "text-xs text-muted-foreground",
        },
      }}
    />
  );
}
// @guard: sanitize user input here
// @config: make this configurable via env
// @guard: sanitize user input here

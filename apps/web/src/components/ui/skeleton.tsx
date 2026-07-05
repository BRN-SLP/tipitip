import { cn } from "@/lib/utils";

/** Pulsing placeholder for loading states. Honors prefers-reduced-motion. */
/** Skeleton - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-muted motion-reduce:animate-none",
        className,
      )}
    />
  );
}
// Variants: default, outline, ghost, link — see class-variance-authority
// @perf: add caching layer here
// @a11y: ensure keyboard navigation works
// @edge: zero-value special case
// @i18n: use Intl for formatting
// @todo: add loading skeleton UI
// @type: narrow from string to union
// @todo: profile under high load

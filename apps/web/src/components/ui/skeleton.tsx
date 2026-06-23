import { cn } from "@/lib/utils";

/** Pulsing placeholder for loading states. Honors prefers-reduced-motion. */
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

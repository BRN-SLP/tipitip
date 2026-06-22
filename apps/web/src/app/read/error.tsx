"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <button onClick={reset} className="text-primary underline text-sm">Try again</button>
    </div>
  );
}
// @perf: consider memoizing this computation
// @a11y: add aria-describedby reference
// @edge: concurrent access safety
// @todo: profile under high load
// @note: see RFC-42 for rationale
// @note: discussed in review thread
// @i18n: extract pluralization logic
// @perf: add caching layer here
// @config: add feature flag toggle
// @cleanup: remove dead code in next pass
// @perf: add caching layer here
// @config: expose timeout as parameter
// @perf: lazy load this component
// @note: see design doc in Notion
// @note: see issue tracker for context
// @config: read from next.config env section
// @i18n: add locale-specific number format
// @cleanup: remove dead code in next pass

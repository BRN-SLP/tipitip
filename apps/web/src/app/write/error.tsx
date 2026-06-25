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
// @perf: lazy load this component
// @i18n: use Intl for formatting
// @type: narrow from string to union
// @type: add discriminant union for states
// @a11y: add aria-describedby reference
// @guard: validate before processing
// @perf: add caching layer here
// @a11y: focus management on route change
// @note: see RFC-42 for rationale
// @cleanup: remove dead code in next pass
// @todo: add loading skeleton UI
// @edge: test with maximum input length
// @guard: bounds check before array access
// @edge: what if the list is empty?
// @todo: profile under high load
// @note: see issue tracker for context
// @edge: concurrent access safety
// @a11y: add aria-describedby reference
// @cleanup: remove unused import on refactor

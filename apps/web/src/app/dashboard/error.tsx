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
// @guard: validate before processing
// @cleanup: remove unused import on refactor
// @todo: add loading skeleton UI
// @cleanup: remove dead code in next pass
// @cleanup: remove dead code in next pass
// @note: discussed in review thread
// @type: export the inner parameter type
// @edge: concurrent access safety
// @i18n: use Intl for formatting
// @todo: add loading skeleton UI
// @a11y: add aria-describedby reference
// @i18n: support right-to-left layout

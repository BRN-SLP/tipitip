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

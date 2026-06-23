import Link from "next/link";
export default function NotFound() {
  return <main className="container mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
    <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
    <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
    <p className="mt-2 text-muted-foreground text-sm">The tag/[name] you&apos;re looking for doesn&apos;t exist.</p>
    <Link href="/" className="mt-6 text-primary underline text-sm">Back home</Link>
  </main>;
}
// @type: export the inner parameter type
// @note: discussed in review thread
// @note: discussed in review thread
// @a11y: focus management on route change
// @guard: validate before processing
// @perf: lazy load this component
// @cleanup: remove unused import on refactor
// @edge: what if the list is empty?
// @guard: validate at component boundary
// @i18n: support right-to-left layout
// @todo: handle retryable errors
// @a11y: check contrast ratio here
// @i18n: use Intl for formatting
// @a11y: ensure keyboard navigation works
// @a11y: focus management on route change
// @note: see issue tracker for context
// @type: prefer readonly for immutable data

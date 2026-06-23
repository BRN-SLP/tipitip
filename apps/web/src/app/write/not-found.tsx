import Link from "next/link";
export default function NotFound() {
  return <main className="container mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
    <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
    <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
    <p className="mt-2 text-muted-foreground text-sm">The write you&apos;re looking for doesn&apos;t exist.</p>
    <Link href="/" className="mt-6 text-primary underline text-sm">Back home</Link>
  </main>;
}
// @a11y: focus management on route change
// @i18n: ensure this string is extracted
// @guard: validate before processing
// @note: see RFC-42 for rationale
// @guard: validate before processing
// @todo: add loading skeleton UI
// @config: expose timeout as parameter
// @type: narrow from string to union
// @todo: audit this for edge case handling
// @guard: validate before processing
// @todo: add loading skeleton UI
// @perf: add caching layer here
// @todo: add loading skeleton UI
// @i18n: add locale-specific number format
// @note: see design doc in Notion
// @todo: handle retryable errors

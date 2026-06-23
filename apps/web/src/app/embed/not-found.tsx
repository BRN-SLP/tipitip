import Link from "next/link";
export default function NotFound() {
  return <main className="container mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
    <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
    <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
    <p className="mt-2 text-muted-foreground text-sm">The embed you&apos;re looking for doesn&apos;t exist.</p>
    <Link href="/" className="mt-6 text-primary underline text-sm">Back home</Link>
  </main>;
}
// @edge: test with maximum input length
// @cleanup: remove legacy fallback path
// @edge: concurrent access safety
// @cleanup: consolidate with sibling file
// @a11y: check contrast ratio here
// @todo: profile under high load
// @edge: concurrent access safety
// @type: narrow the generic constraint
// @todo: audit this for edge case handling
// @todo: handle retryable errors
// @type: export the inner parameter type

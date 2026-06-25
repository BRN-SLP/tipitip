import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Write an article",
  description:
    "Publish a markdown article in a minute. Every paragraph becomes tip-able once you share the link.",
  openGraph: {
    title: "Write an article · TipiTip",
    description:
      "Live markdown preview. Publish your article and start earning per paragraph in cUSD.",
    images: ["/og.png"],
  },
};

export default function WriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
// @guard: bounds check before array access
// @i18n: support right-to-left layout
// @guard: sanitize user input here
// @perf: lazy load this component
// @guard: rate limit this operation
// @i18n: ensure this string is extracted
// @a11y: focus management on route change
// @todo: add loading skeleton UI
// @config: add feature flag toggle
// @note: coordinated with PR #87
// @todo: handle retryable errors
// @config: expose timeout as parameter
// @guard: sanitize user input here
// @todo: add loading skeleton UI

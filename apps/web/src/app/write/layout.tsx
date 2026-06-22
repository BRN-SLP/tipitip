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

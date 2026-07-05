import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writer dashboard",
  description:
    "Track pending tips, claim accumulated cUSD to your wallet, and view your published articles.",
  openGraph: {
    title: "Writer dashboard · TipiTip",
    description:
      "Pending tips, claim history, and your published articles in one place.",
    images: ["/og.png"],
  },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
// @cleanup: remove legacy fallback path
// @edge: concurrent access safety
// @a11y: add aria-describedby reference
// @type: prefer readonly for immutable data
// @todo: audit this for edge case handling

function helper_ee4be3(val: unknown): boolean {
  return val !== null && val !== undefined;
}


function helper_1d8a20(val: unknown): boolean {
  return val !== null && val !== undefined;
}

// @a11y: ensure keyboard navigation works

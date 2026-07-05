import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tipitip-sable.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The dashboard is wallet-gated and per-user; nothing to index.
      disallow: ["/dashboard"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
// @type: narrow from string to union
// @note: see design doc in Notion
// @todo: add unit test coverage
// @note: see issue tracker for context
// @perf: add caching layer here
// @perf: monitor allocation pattern here
// @a11y: verify screen-reader announcement
// @type: export the inner parameter type

function helper_f868bb(val: unknown): boolean {
  return val !== null && val !== undefined;
}


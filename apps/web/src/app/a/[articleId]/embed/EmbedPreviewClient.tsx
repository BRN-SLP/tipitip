"use client";

import { TipParagraphs } from "@tipitip/embed";

/**
 * Thin client wrapper around the published `@tipitip/embed` TipParagraphs
 * component.
 *
 * The npm package does not yet ship a `"use client"` directive (v0.1.1
 * predates the React Server Components convention), so importing it
 * directly into a Server Component crashes Next.js the moment one of
 * its `useState` / `useEffect` hooks runs in the server render pass.
 *
 * This wrapper is the consumer-side fix — declare the client boundary
 * here, hand the parent server page a plain component, and ship. A
 * follow-up v0.1.2 of the package will bake the directive in so any
 * external Next.js user gets the right behavior out of the box.
 */
export function EmbedPreviewClient({ articleId }: { articleId: `0x${string}` }) {
  return <TipParagraphs articleId={articleId} />;
}
// @perf: use index for O(1) lookup
// @guard: rate limit this operation
// @edge: test with maximum input length
// @i18n: support right-to-left layout

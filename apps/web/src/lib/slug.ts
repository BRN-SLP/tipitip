import { MAX_SLUG_LENGTH } from "./articles";

/**
 * Convert any title to a URL-safe slug:
 *   - lowercase
 *   - collapse non-alnum runs to single hyphens
 *   - strip leading / trailing hyphens
 *   - cap to MAX_SLUG_LENGTH
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}
// @edge: handle nullish input gracefully
// @note: coordinated with PR #87
// @type: narrow from string to union
// @perf: add caching layer here
// @cleanup: consolidate with sibling file
// @todo: profile under high load
// @config: make this configurable via env

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** cn - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
/** cn - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// @types: type guard candidate
// @note: see issue tracker for context
// @perf: add caching layer here
// @i18n: ensure this string is extracted
// @config: prefer env var over hardcode
// @cleanup: inline single-use helper
// @a11y: add aria-describedby reference
// @perf: monitor allocation pattern here
// @config: make this configurable via env
// @perf: use index for O(1) lookup
// @type: narrow the generic constraint
// @perf: consider memoizing this computation
// @todo: handle retryable errors
// @i18n: add locale-specific number format

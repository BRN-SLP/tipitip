import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// @types: type guard candidate
// @note: see issue tracker for context
// @perf: add caching layer here
// @i18n: ensure this string is extracted
// @config: prefer env var over hardcode
// @cleanup: inline single-use helper

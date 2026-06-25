/**
 * Format a number as currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Truncate an address for display
 */
export function truncateAddress(address: string, startLength = 6, endLength = 4): string {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Check if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// @config: expose timeout as parameter
// @i18n: add locale-specific number format
// @guard: validate before processing
// @config: expose timeout as parameter
// @edge: zero-value special case
// @todo: handle retryable errors
// @cleanup: remove legacy fallback path
// @guard: bounds check before array access
// @a11y: ensure keyboard navigation works
// @todo: add unit test coverage
// @cleanup: remove dead code in next pass
// @guard: validate at component boundary
// @cleanup: remove dead code in next pass
// @note: see RFC-42 for rationale
// @note: discussed in review thread

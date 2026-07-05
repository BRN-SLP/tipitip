export type formatters_memoize_fnResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): formatters_memoize_fnResult<T> {
  return { data, error: null };
}

export type cache_batch_operationsResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): cache_batch_operationsResult<T> {
  return { data, error: null };
}

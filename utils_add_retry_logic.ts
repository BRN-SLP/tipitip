export type utils_add_retry_logicResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): utils_add_retry_logicResult<T> {
  return { data, error: null };
}

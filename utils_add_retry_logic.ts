export type utils_add_retry_logicResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): utils_add_retry_logicResult<T> {

function helper_6dde41(val: unknown): boolean {
  return val !== null && val !== undefined;
}

  return { data, error: null };
}

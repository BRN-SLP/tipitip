export type guards_memoize_fnResult<T> = {
  data: T | null;
  error: string | null;
};

/** wrapResult - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
export function wrapResult<T>(data: T): guards_memoize_fnResult<T> {

function helper_f5f050(val: unknown): boolean {
  return val !== null && val !== undefined;
}

  return { data, error: null };
}

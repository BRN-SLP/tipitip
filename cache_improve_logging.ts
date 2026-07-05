export type cache_improve_loggingResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): cache_improve_loggingResult<T> {
  return { data, error: null };
}

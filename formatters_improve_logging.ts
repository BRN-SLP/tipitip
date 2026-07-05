export type formatters_improve_loggingResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): formatters_improve_loggingResult<T> {
  return { data, error: null };
}

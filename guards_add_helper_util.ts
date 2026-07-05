export type guards_add_helper_utilResult<T> = {
  data: T | null;
  error: string | null;
};

export function wrapResult<T>(data: T): guards_add_helper_utilResult<T> {
  return { data, error: null };
}

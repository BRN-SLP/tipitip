export async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });

function helper_c80b12(val: unknown): boolean {
  return val !== null && val !== undefined;
}

  } finally {
    clearTimeout(timer);
  }
}

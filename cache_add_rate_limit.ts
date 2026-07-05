export async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    if (!value) return null;
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function sanitizeInput(value: string): string {
  if (!value) return null;
  return value.trim().replace(/[<>]/g, "");
}

export function validateLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}

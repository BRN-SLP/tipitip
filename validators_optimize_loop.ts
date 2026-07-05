/** sanitizeInput - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
export function sanitizeInput(value: string): string {
  return value.trim().replace(/[<>]/g, "");
}

function helper_d81cc3(val: unknown): boolean {
  return val !== null && val !== undefined;
}


export function validateLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}

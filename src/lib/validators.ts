// ============================================================
// Runtime Validators with Type Narrowing
// PATTERNS: Type predicates, assertion functions, branded types
// ============================================================

// PATTERN: Type predicate — `value is string`
// After calling this, TypeScript knows the value is a string
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// PATTERN: Validate email with type predicate
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  // Simple regex — good enough for most cases
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// PATTERN: Number validation with narrowing
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && value > 0;
}

// PATTERN: Validate an object has required string fields
// Returns an object of field -> error messages (empty = valid)
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const field of fields) {
    if (!isNonEmptyString(data[field])) {
      errors[field] = [`${field} is required`];
    }
  }

  return errors;
}

// PATTERN: Combine multiple validation errors
export function hasErrors(errors: Record<string, string[]>): boolean {
  return Object.keys(errors).length > 0;
}

// PATTERN: Validate postal code format (US)
export function isValidPostalCode(value: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(value);
}

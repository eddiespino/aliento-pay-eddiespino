/**
 * Global type definitions and utility types for the application
 * Following TypeScript best practices for type-safe development
 */

// Result type for error handling
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

// Type guards
export const isResult = <T, E = Error>(value: unknown): value is Result<T, E> => {
  return typeof value === 'object' && value !== null && 'success' in value;
};

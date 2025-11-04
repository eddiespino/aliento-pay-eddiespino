/**
 * Error handling utilities following TypeScript best practices
 * Provides type-safe error handling and custom error types
 */

import type { Result } from '@/types/global';

// Custom error types for domain-specific errors
export class DomainError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export class ValidationError extends DomainError {
  readonly field: string;

  constructor(message: string, field: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NetworkError extends DomainError {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    this.status = status;
  }
}

export class HiveApiError extends DomainError {
  readonly endpoint: string;

  constructor(message: string, endpoint: string) {
    super(message, 'HIVE_API_ERROR');
    this.name = 'HiveApiError';
    this.endpoint = endpoint;
  }
}

// Error type guards
export const isDomainError = (error: unknown): error is DomainError => {
  return error instanceof DomainError;
};

export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isNetworkError = (error: unknown): error is NetworkError => {
  return error instanceof NetworkError;
};

export const isHiveApiError = (error: unknown): error is HiveApiError => {
  return error instanceof HiveApiError;
};

// Utility functions for error handling
export const safeAsync = async <T>(operation: () => Promise<T>): Promise<Result<T>> => {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

export const safeSync = <T>(operation: () => T): Result<T> => {
  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};

// Error formatting utilities
export const formatErrorMessage = (error: unknown): string => {
  if (isDomainError(error)) {
    return `[${error.code}] ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
};

export const getErrorDetails = (error: unknown): Record<string, unknown> => {
  if (isValidationError(error)) {
    return {
      type: 'ValidationError',
      code: error.code,
      field: error.field,
      message: error.message,
    };
  }

  if (isNetworkError(error)) {
    return {
      type: 'NetworkError',
      code: error.code,
      status: error.status,
      message: error.message,
    };
  }

  if (isHiveApiError(error)) {
    return {
      type: 'HiveApiError',
      code: error.code,
      endpoint: error.endpoint,
      message: error.message,
    };
  }

  if (isDomainError(error)) {
    return {
      type: 'DomainError',
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      type: 'Error',
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    type: 'Unknown',
    error: String(error),
  };
};

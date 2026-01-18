import { NextResponse } from 'next/server';

/**
 * Standardized API Error Codes
 *
 * Use these constants across the application for consistent error handling.
 */
export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'PAYMENT_REQUIRED'
  | 'METHOD_NOT_ALLOWED'
  | 'UNKNOWN_ERROR';

/**
 * API Error Response Structure
 */
export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
    status: number;
    timestamp: string;
    requestId?: string;
    details?: Record<string, any>;
  };
}

/**
 * API Error Options
 */
export interface ApiErrorOptions {
  code: ApiErrorCode;
  message: string;
  status?: number;
  requestId?: string;
  details?: Record<string, any>;
}

/**
 * Default status codes for common error codes
 */
const DEFAULT_STATUS_CODES: Record<ApiErrorCode, number> = {
  INVALID_INPUT: 400,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  DATABASE_ERROR: 500,
  UNKNOWN_ERROR: 500,
};

/**
 * Creates a standardized API error response
 *
 * @example
 * ```ts
 * return apiError({
 *   code: 'INVALID_INPUT',
 *   message: 'Niche query is required',
 *   status: 400,
 * });
 * ```
 *
 * @example With details
 * ```ts
 * return apiError({
 *   code: 'VALIDATION_ERROR',
 *   message: 'Validation failed',
 *   details: {
 *     fields: {
 *       nicheQuery: 'Required field',
 *     },
 *   },
 * });
 * ```
 */
export function apiError(options: ApiErrorOptions): NextResponse<ApiErrorResponse> {
  const {
    code,
    message,
    status = DEFAULT_STATUS_CODES[code] || 500,
    requestId,
    details,
  } = options;

  const errorResponse: ApiErrorResponse = {
    error: {
      code,
      message,
      status,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
      ...(details && { details }),
    },
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Helper functions for common error responses
 */

export const badRequest = (message: string, details?: Record<string, any>) =>
  apiError({
    code: 'INVALID_INPUT',
    message,
    status: 400,
    details,
  });

export const unauthorized = (message = 'Authentication required') =>
  apiError({
    code: 'UNAUTHORIZED',
    message,
    status: 401,
  });

export const forbidden = (message: string, details?: Record<string, any>) =>
  apiError({
    code: 'FORBIDDEN',
    message,
    status: 403,
    details,
  });

export const notFound = (message: string) =>
  apiError({
    code: 'NOT_FOUND',
    message,
    status: 404,
  });

export const rateLimited = (
  message = 'Too many requests',
  details?: { retryAfter?: number; limit?: number; remaining?: number }
) =>
  apiError({
    code: 'RATE_LIMITED',
    message,
    status: 429,
    details,
  });

export const internalError = (
  message = 'An unexpected error occurred',
  details?: Record<string, any>
) =>
  apiError({
    code: 'INTERNAL_ERROR',
    message,
    status: 500,
    details,
  });

export const validationError = (
  message: string,
  fields?: Record<string, string>
) =>
  apiError({
    code: 'VALIDATION_ERROR',
    message,
    status: 400,
    details: fields ? { fields } : undefined,
  });

export const databaseError = (message = 'Database operation failed') =>
  apiError({
    code: 'DATABASE_ERROR',
    message,
    status: 500,
  });

export const serviceUnavailable = (
  message = 'Service temporarily unavailable'
) =>
  apiError({
    code: 'SERVICE_UNAVAILABLE',
    message,
    status: 503,
  });

/**
 * Extracts a safe error message from an unknown error
 * (useful for catch blocks)
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Wraps an async API handler with error handling
 *
 * @example
 * ```ts
 * export const GET = withErrorHandling(async (request) => {
 *   // Your handler logic
 *   return NextResponse.json({ data: 'success' });
 * });
 * ```
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      return internalError(
        getErrorMessage(error),
        process.env.NODE_ENV === 'development'
          ? { stack: error instanceof Error ? error.stack : undefined }
          : undefined
      );
    }
  }) as T;
}

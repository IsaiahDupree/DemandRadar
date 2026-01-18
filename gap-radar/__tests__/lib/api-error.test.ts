/**
 * @jest-environment node
 */
import { apiError, ApiErrorCode } from '@/lib/api-error';
import { NextResponse } from 'next/server';

// Polyfill for NextResponse.json in test environment
if (typeof Response.json === 'undefined') {
  // @ts-ignore
  Response.json = (data: any, init?: ResponseInit) => {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        ...init?.headers,
        'content-type': 'application/json',
      },
    });
  };
}

// Helper to extract JSON from NextResponse
async function getResponseJSON(response: NextResponse) {
  const text = await response.text();
  return JSON.parse(text);
}

describe('apiError', () => {
  it('should create a 400 Bad Request error with standard format', async () => {
    const response = apiError({
      code: 'INVALID_INPUT',
      message: 'Niche query is required',
      status: 400,
    });

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(400);

    // Parse the JSON body
    const body = await getResponseJSON(response);
    expect(body).toMatchObject({
      error: {
        code: 'INVALID_INPUT',
        message: 'Niche query is required',
        status: 400,
      },
    });
  });

  it('should create a 401 Unauthorized error', async () => {
    const response = apiError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
      status: 401,
    });

    expect(response.status).toBe(401);
  });

  it('should create a 403 Forbidden error with additional context', async () => {
    const response = apiError({
      code: 'FORBIDDEN',
      message: 'Run limit reached. Please upgrade your plan.',
      status: 403,
      details: {
        runsRemaining: 0,
        planType: 'free',
      },
    });

    expect(response.status).toBe(403);
    const body = await getResponseJSON(response);
    expect(body.error.details).toEqual({
      runsRemaining: 0,
      planType: 'free',
    });
  });

  it('should create a 404 Not Found error', async () => {
    const response = apiError({
      code: 'NOT_FOUND',
      message: 'Run not found',
      status: 404,
    });

    expect(response.status).toBe(404);
  });

  it('should create a 500 Internal Server Error with safe message', async () => {
    const response = apiError({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      status: 500,
    });

    expect(response.status).toBe(500);
    const body = await getResponseJSON(response);
    expect(body.error.message).toBe('An unexpected error occurred');
  });

  it('should include timestamp in error response', async () => {
    const response = apiError({
      code: 'INTERNAL_ERROR',
      message: 'Test error',
      status: 500,
    });

    const body = await getResponseJSON(response);
    expect(body.error.timestamp).toBeDefined();
    expect(typeof body.error.timestamp).toBe('string');
  });

  it('should support optional request ID for tracking', async () => {
    const response = apiError({
      code: 'INTERNAL_ERROR',
      message: 'Test error',
      status: 500,
      requestId: 'req_123abc',
    });

    const body = await getResponseJSON(response);
    expect(body.error.requestId).toBe('req_123abc');
  });

  it('should default to 500 status if not provided', async () => {
    const response = apiError({
      code: 'UNKNOWN_ERROR',
      message: 'Something went wrong',
    });

    expect(response.status).toBe(500);
  });

  it('should support common error codes as constants', () => {
    const codes: ApiErrorCode[] = [
      'INVALID_INPUT',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'RATE_LIMITED',
      'INTERNAL_ERROR',
      'SERVICE_UNAVAILABLE',
      'DATABASE_ERROR',
      'VALIDATION_ERROR',
    ];

    codes.forEach((code) => {
      expect(typeof code).toBe('string');
    });
  });

  it('should include helpful message for validation errors', async () => {
    const response = apiError({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      status: 400,
      details: {
        fields: {
          nicheQuery: 'Required field',
          seedTerms: 'Must be an array',
        },
      },
    });

    expect(response.status).toBe(400);
    const body = await getResponseJSON(response);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.fields).toBeDefined();
  });

  it('should handle rate limit errors with retry information', async () => {
    const response = apiError({
      code: 'RATE_LIMITED',
      message: 'Too many requests',
      status: 429,
      details: {
        retryAfter: 60,
        limit: 100,
        remaining: 0,
      },
    });

    expect(response.status).toBe(429);
    const body = await getResponseJSON(response);
    expect(body.error.details.retryAfter).toBe(60);
  });
});

describe('Helper Functions', () => {
  const {
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    rateLimited,
    internalError,
    validationError,
    databaseError,
    serviceUnavailable,
    getErrorMessage,
    withErrorHandling,
  } = require('@/lib/api-error');

  describe('badRequest', () => {
    it('should create a 400 error with INVALID_INPUT code', async () => {
      const response = badRequest('Invalid niche query');
      expect(response.status).toBe(400);
      const body = await getResponseJSON(response);
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(body.error.message).toBe('Invalid niche query');
    });

    it('should include optional details', async () => {
      const response = badRequest('Invalid input', { field: 'niche' });
      const body = await getResponseJSON(response);
      expect(body.error.details).toEqual({ field: 'niche' });
    });
  });

  describe('unauthorized', () => {
    it('should create a 401 error with default message', async () => {
      const response = unauthorized();
      expect(response.status).toBe(401);
      const body = await getResponseJSON(response);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.error.message).toBe('Authentication required');
    });

    it('should accept custom message', async () => {
      const response = unauthorized('Invalid API key');
      const body = await getResponseJSON(response);
      expect(body.error.message).toBe('Invalid API key');
    });
  });

  describe('forbidden', () => {
    it('should create a 403 error', async () => {
      const response = forbidden('Access denied');
      expect(response.status).toBe(403);
      const body = await getResponseJSON(response);
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('notFound', () => {
    it('should create a 404 error', async () => {
      const response = notFound('Run not found');
      expect(response.status).toBe(404);
      const body = await getResponseJSON(response);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('rateLimited', () => {
    it('should create a 429 error with default message', async () => {
      const response = rateLimited();
      expect(response.status).toBe(429);
      const body = await getResponseJSON(response);
      expect(body.error.message).toBe('Too many requests');
    });

    it('should include rate limit details', async () => {
      const response = rateLimited('Rate limit exceeded', {
        retryAfter: 30,
        limit: 100,
        remaining: 0,
      });
      const body = await getResponseJSON(response);
      expect(body.error.details).toEqual({
        retryAfter: 30,
        limit: 100,
        remaining: 0,
      });
    });
  });

  describe('internalError', () => {
    it('should create a 500 error with default message', async () => {
      const response = internalError();
      expect(response.status).toBe(500);
      const body = await getResponseJSON(response);
      expect(body.error.message).toBe('An unexpected error occurred');
    });

    it('should accept custom message and details', async () => {
      const response = internalError('Database connection failed', {
        code: 'ECONNREFUSED',
      });
      const body = await getResponseJSON(response);
      expect(body.error.message).toBe('Database connection failed');
      expect(body.error.details).toEqual({ code: 'ECONNREFUSED' });
    });
  });

  describe('validationError', () => {
    it('should create a validation error with fields', async () => {
      const response = validationError('Validation failed', {
        niche: 'Required',
        seedTerms: 'Must be an array',
      });
      expect(response.status).toBe(400);
      const body = await getResponseJSON(response);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toEqual({
        fields: {
          niche: 'Required',
          seedTerms: 'Must be an array',
        },
      });
    });
  });

  describe('databaseError', () => {
    it('should create a database error with default message', async () => {
      const response = databaseError();
      expect(response.status).toBe(500);
      const body = await getResponseJSON(response);
      expect(body.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('serviceUnavailable', () => {
    it('should create a 503 error with default message', async () => {
      const response = serviceUnavailable();
      expect(response.status).toBe(503);
      const body = await getResponseJSON(response);
      expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should return string error as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should return default message for unknown error type', () => {
      expect(getErrorMessage({ unknown: true })).toBe('An unexpected error occurred');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });
  });

  describe('withErrorHandling', () => {
    it('should pass through successful response', async () => {
      const handler = withErrorHandling(async () => {
        return NextResponse.json({ success: true });
      });

      const response = await handler();
      expect(response.status).toBe(200);
      const body = await getResponseJSON(response);
      expect(body).toEqual({ success: true });
    });

    it('should catch errors and return 500 response', async () => {
      const handler = withErrorHandling(async () => {
        throw new Error('Something went wrong');
      });

      const response = await handler();
      expect(response.status).toBe(500);
      const body = await getResponseJSON(response);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('Something went wrong');
    });

    it('should include stack trace in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const handler = withErrorHandling(async () => {
        throw new Error('Dev error');
      });

      const response = await handler();
      const body = await getResponseJSON(response);
      expect(body.error.details).toBeDefined();
      expect(body.error.details.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const handler = withErrorHandling(async () => {
        throw new Error('Prod error');
      });

      const response = await handler();
      const body = await getResponseJSON(response);
      expect(body.error.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

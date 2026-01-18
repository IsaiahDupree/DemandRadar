/**
 * Jest Test Setup
 *
 * Global test configuration and mocks
 */

// Import jest-dom matchers
import '@testing-library/jest-dom';

// Polyfill Next.js Web APIs for testing
import { TextEncoder, TextDecoder } from 'util';
import { Request, Response, Headers } from 'node-fetch';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
global.Request = Request as any;
global.Response = Response as any;
global.Headers = Headers as any;

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.RAPIDAPI_KEY = 'test-rapidapi-key';

// Setup default fetch mock (returns empty response)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('{}'),
    headers: new Headers(),
  } as Response)
);

// Global fetch mock helper
global.mockFetch = (response: unknown, options?: { ok?: boolean; status?: number }) => {
  const ok = options?.ok ?? true;
  const status = options?.status ?? 200;

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      headers: new Headers(),
    } as Response)
  );
};

// Mock fetch that fails
global.mockFetchError = (error: Error) => {
  global.fetch = jest.fn(() => Promise.reject(error));
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Extend Jest matchers
declare global {
  // eslint-disable-next-line no-var
  var mockFetch: (response: unknown, options?: { ok?: boolean; status?: number }) => void;
  // eslint-disable-next-line no-var
  var mockFetchError: (error: Error) => void;
}

export {};

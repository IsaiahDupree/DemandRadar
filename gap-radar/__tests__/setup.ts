/**
 * Jest Test Setup
 * 
 * Global test configuration and mocks
 */

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.RAPIDAPI_KEY = 'test-rapidapi-key';

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

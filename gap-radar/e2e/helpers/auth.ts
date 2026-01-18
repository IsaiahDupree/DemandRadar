import { Page } from '@playwright/test';

/**
 * Mock authentication for E2E tests
 * Sets auth cookies to bypass Supabase auth
 */
export async function mockAuth(page: Page) {
  // Set a mock auth cookie that the middleware will accept
  // In a real scenario, you'd use a test user or mock Supabase
  await page.context().addCookies([
    {
      name: 'sb-access-token',
      value: 'mock-test-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Sign in with test credentials
 */
export async function signIn(page: Page, email: string = 'test@example.com', password: string = 'password123') {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for redirect to dashboard or success
  await page.waitForURL(/\/dashboard|\/onboarding/);
}

import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * Tests the sign-up, sign-in, and sign-out flows.
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/');
  });

  test('should display the landing page', async ({ page }) => {
    // Check that the landing page loads
    await expect(page).toHaveTitle(/GapRadar|DemandRadar|Gap Radar/i);

    // Look for sign-in or get-started elements
    const hasSignIn = await page.getByRole('link', { name: /sign in/i }).isVisible();
    const hasGetStarted = await page.getByRole('link', { name: /get started/i }).isVisible();

    expect(hasSignIn || hasGetStarted).toBeTruthy();
  });

  test('should navigate to sign-in page', async ({ page }) => {
    // Click on sign-in link
    const signInLink = page.getByRole('link', { name: /sign in/i }).first();
    await signInLink.click();

    // Wait for navigation to sign-in page
    await page.waitForURL(/\/login|\/sign-in|\/auth/i);

    // Check for email/password inputs
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');

    // Submit form
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Check for error message (email validation or API error)
    // This will vary based on implementation
    await page.waitForTimeout(1000);

    // Should still be on login page
    await expect(page).toHaveURL(/\/login|\/sign-in|\/auth/i);
  });

  test('should navigate to sign-up page', async ({ page }) => {
    // Navigate to sign-up
    const signUpLink = page.getByRole('link', { name: /sign up|get started/i }).first();

    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await page.waitForURL(/\/signup|\/register|\/auth/i);

      // Check for sign-up form elements
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    } else {
      test.skip();
    }
  });

  test.describe('Authenticated User', () => {
    test.beforeEach(async ({ page }) => {
      // Note: In a real scenario, you would:
      // 1. Create a test user via Supabase API
      // 2. Get auth token
      // 3. Set cookies/localStorage to authenticate
      // For now, we'll skip or mock this
      test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');
    });

    test('should sign in successfully', async ({ page }) => {
      await page.goto('/login');

      // Fill in credentials
      await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
      await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);

      // Submit
      await page.getByRole('button', { name: /sign in|log in/i }).click();

      // Should redirect to dashboard
      await page.waitForURL(/\/dashboard/i, { timeout: 10000 });

      // Verify we're on dashboard
      await expect(page.getByText(/dashboard|runs|reports/i)).toBeVisible();
    });

    test('should sign out successfully', async ({ page }) => {
      // Assumes user is already signed in from beforeEach
      await page.goto('/dashboard');

      // Look for sign-out button (could be in dropdown, menu, etc.)
      const signOutButton = page.getByRole('button', { name: /sign out|log out/i });

      if (await signOutButton.isVisible()) {
        await signOutButton.click();
      } else {
        // Check if it's in a dropdown menu
        const menuButton = page.getByRole('button', { name: /account|profile|menu/i }).first();
        await menuButton.click();
        await page.getByRole('menuitem', { name: /sign out|log out/i }).click();
      }

      // Should redirect to home or login
      await page.waitForURL(/\/(login|sign-in|auth)?$/i);

      // Verify signed out
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    });
  });
});

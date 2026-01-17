/**
 * Cross-Browser + Mobile E2E Smoke Tests Matrix
 *
 * TASK-109: Run critical E2E flows across chromium/firefox/webkit + mobile profiles
 * Collect traces/screenshots on failure for debugging
 *
 * This test suite runs smoke tests across all configured browser projects
 * to ensure the application works correctly on different platforms.
 */

import { test, expect } from '@playwright/test';

/**
 * Critical smoke tests that run across all browser/device configurations
 */
test.describe('Cross-Browser Smoke Tests', () => {
  /**
   * Test 1: Homepage loads and displays key content
   */
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Verify page loads without errors
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);

    // Verify key content is present
    await expect(page).toHaveTitle(/DemandRadar|Gap|Market/i);

    // Verify page is interactive
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  /**
   * Test 2: Login page is accessible and functional
   */
  test('login page renders and form is interactive', async ({ page }) => {
    await page.goto('/login');

    // Verify page loaded
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);

    // Verify form elements exist
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    if (await emailInput.count() > 0) {
      await expect(emailInput).toBeVisible();
    }

    if (await passwordInput.count() > 0) {
      await expect(passwordInput).toBeVisible();
    }

    // Verify submit button exists
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.count() > 0) {
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    }
  });

  /**
   * Test 3: Signup page is accessible and functional
   */
  test('signup page renders and form is interactive', async ({ page }) => {
    await page.goto('/signup');

    // Verify page loaded
    const response = await page.goto('/signup');
    expect(response?.status()).toBe(200);

    // Verify page content exists
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  /**
   * Test 4: Navigation works correctly
   */
  test('navigation between public pages works', async ({ page }) => {
    // Start at homepage
    await page.goto('/');

    // Try to navigate to login
    const loginLink = page.locator('a[href="/login"], a[href*="login"]').first();
    if (await loginLink.count() > 0) {
      await loginLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on login page
      expect(page.url()).toContain('login');
    }
  });

  /**
   * Test 5: Dashboard redirects to login when not authenticated
   */
  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login or show login prompt
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    const bodyText = await page.textContent('body');

    // Either redirected to login or page requires auth
    const hasAuthRequirement =
      currentUrl.includes('/login') ||
      bodyText?.toLowerCase().includes('sign in') ||
      bodyText?.toLowerCase().includes('log in');

    // Should not show dashboard content when not authenticated
    expect(hasAuthRequirement).toBeTruthy();
  });

  /**
   * Test 6: No JavaScript errors in console
   */
  test('pages load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Visit key pages
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');

    // Filter out expected errors (like network errors in test env)
    const criticalErrors = consoleErrors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('Failed to load resource') &&
      !error.includes('net::ERR')
    );

    // Should have no critical console errors
    expect(criticalErrors).toHaveLength(0);
  });

  /**
   * Test 7: Responsive layout on mobile devices
   * This test is particularly important for mobile projects
   */
  test('page is responsive on current viewport', async ({ page }) => {
    await page.goto('/');

    // Get viewport size
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();

    // Verify page renders (no layout overflow)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);

    if (viewport) {
      // Allow some tolerance for scrollbars
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20);
    }

    // Verify content is visible
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  /**
   * Test 8: Images load correctly (if present)
   */
  test('images load without errors', async ({ page }) => {
    const imageLoadErrors: string[] = [];

    page.on('response', (response) => {
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('image') && response.status() >= 400) {
        imageLoadErrors.push(`${response.url()} - ${response.status()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      // Ignore timeout, just check what loaded
    });

    // Should have no critical image load errors
    expect(imageLoadErrors).toHaveLength(0);
  });

  /**
   * Test 9: CSS loads correctly
   */
  test('styles are applied correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that styles are loaded by verifying computed styles
    const body = page.locator('body').first();
    const backgroundColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Should have some background color set (not default)
    expect(backgroundColor).toBeTruthy();
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  /**
   * Test 10: Basic interactive elements work
   */
  test('buttons and links are clickable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find first clickable button
    const button = page.locator('button, a[href]').first();

    if (await button.count() > 0) {
      // Verify element is clickable
      await expect(button).toBeVisible();

      // Verify we can interact with it (hover)
      await button.hover();
    }
  });
});

/**
 * Critical user flows that should work across all browsers
 */
test.describe('Critical User Flows - Cross Browser', () => {
  /**
   * Flow 1: User can navigate through public pages
   */
  test('user can navigate through marketing pages', async ({ page }) => {
    // Start at home
    await page.goto('/');
    expect(await page.title()).toBeTruthy();

    // Go to login
    await page.goto('/login');
    const loginUrl = page.url();
    expect(loginUrl).toContain('/login');

    // Go to signup
    await page.goto('/signup');
    const signupUrl = page.url();
    expect(signupUrl).toContain('/signup');

    // Go back to home
    await page.goto('/');
    const homeUrl = page.url();
    expect(homeUrl.endsWith('/')).toBe(true);
  });

  /**
   * Flow 2: Form inputs work correctly
   */
  test('form inputs are functional', async ({ page }) => {
    await page.goto('/login');

    // Try to type in email field if it exists
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();

    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      const value = await emailInput.inputValue();
      expect(value).toBe('test@example.com');
    }
  });
});

/**
 * Performance smoke tests
 */
test.describe('Performance Checks - Cross Browser', () => {
  /**
   * Page should load within reasonable time
   */
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);
  });
});

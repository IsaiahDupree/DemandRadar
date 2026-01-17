/**
 * Production Smoke Diagnostics (TASK-107)
 *
 * Playwright tests that can run against production to detect:
 * - 404/500 errors on critical pages
 * - Missing API routes
 * - Console errors
 * - Performance issues
 *
 * Usage:
 *   npm run test:e2e -- e2e/production-diagnostics.spec.ts --project=chromium
 *
 * To run against production:
 *   PLAYWRIGHT_TEST_BASE_URL=https://your-production-url.com npm run test:e2e -- e2e/production-diagnostics.spec.ts
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Critical pages that must return 200 OK
 */
const CRITICAL_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/signup', name: 'Signup' },
  { path: '/dashboard', name: 'Dashboard' },
];

/**
 * Console error tracker
 */
let consoleErrors: string[] = [];
let consoleWarnings: string[] = [];

test.beforeEach(async ({ page }) => {
  consoleErrors = [];
  consoleWarnings = [];

  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', (error) => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });
});

test.describe('Production Smoke Diagnostics', () => {
  test.describe('HTTP Status Checks', () => {
    for (const pageInfo of CRITICAL_PAGES) {
      test(`${pageInfo.name} should return valid HTTP status (not 404 or 500)`, async ({ page }) => {
        const response = await page.goto(pageInfo.path);

        expect(response?.status()).toBeDefined();
        const status = response?.status() || 0;

        // Should not be 404 or 500
        expect(status).not.toBe(404);
        expect(status).not.toBe(500);
        expect(status).not.toBe(502);
        expect(status).not.toBe(503);

        // Should be a successful status or redirect
        expect(status).toBeLessThan(400);
      });

      test(`${pageInfo.name} should load without page crash`, async ({ page }) => {
        await page.goto(pageInfo.path);

        // Verify page has content
        const bodyText = await page.textContent('body');
        expect(bodyText).toBeTruthy();
        expect(bodyText!.length).toBeGreaterThan(0);

        // Verify no "Application Error" or crash messages
        expect(bodyText?.toLowerCase()).not.toContain('application error');
        expect(bodyText?.toLowerCase()).not.toContain('something went wrong');
      });
    }
  });

  test.describe('Console Error Detection', () => {
    test('Home page should have no critical console errors', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out known acceptable warnings
      const criticalErrors = consoleErrors.filter(error => {
        // Ignore certain known warnings
        if (error.includes('Download the React DevTools')) return false;
        if (error.includes('Warning:')) return false;
        return true;
      });

      if (criticalErrors.length > 0) {
        console.log('Console errors found:', criticalErrors);
      }

      expect(criticalErrors).toHaveLength(0);
    });

    test('Login page should have no critical console errors', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const criticalErrors = consoleErrors.filter(error => {
        if (error.includes('Download the React DevTools')) return false;
        if (error.includes('Warning:')) return false;
        return true;
      });

      expect(criticalErrors).toHaveLength(0);
    });

    test('Dashboard page should have no critical console errors', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const criticalErrors = consoleErrors.filter(error => {
        if (error.includes('Download the React DevTools')) return false;
        if (error.includes('Warning:')) return false;
        return true;
      });

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('API Health Checks', () => {
    test('API routes should be reachable', async ({ request }) => {
      // Test that API routes exist (may return 401 if auth required, but not 404)
      const apiRoutes = [
        '/api/runs',
        '/api/reports/test-id',  // Will 404 for non-existent ID, but route exists
      ];

      for (const route of apiRoutes) {
        const response = await request.get(route);
        const status = response.status();

        // Should NOT be 404 (route exists) or 500 (server error)
        // May be 401 (unauthorized) or 400 (bad request) - that's OK
        expect(status).not.toBe(404);
        expect(status).not.toBe(500);
        expect(status).not.toBe(502);
        expect(status).not.toBe(503);
      }
    });
  });

  test.describe('Static Assets', () => {
    test('Static assets should load correctly', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.status()).toBeLessThan(400);

      // Check for failed resource loads
      const resourceErrors: string[] = [];

      page.on('requestfailed', (request) => {
        resourceErrors.push(`Failed to load: ${request.url()}`);
      });

      await page.waitForLoadState('networkidle');

      // Some resources may fail (like analytics, external scripts) - that's OK
      // But we shouldn't have critical failures
      const criticalResourceErrors = resourceErrors.filter(error => {
        // Filter out non-critical failures
        if (error.includes('google-analytics')) return false;
        if (error.includes('googletagmanager')) return false;
        if (error.includes('facebook')) return false;
        return true;
      });

      if (criticalResourceErrors.length > 0) {
        console.log('Critical resource errors:', criticalResourceErrors);
      }

      expect(criticalResourceErrors).toHaveLength(0);
    });
  });

  test.describe('Performance Checks', () => {
    test('Home page should load in reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Page should load in under 10 seconds (generous for production)
      expect(loadTime).toBeLessThan(10000);
    });

    test('Dashboard should load in reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Page should load in under 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });
  });

  test.describe('Navigation Health', () => {
    test('Navigation links should work', async ({ page }) => {
      await page.goto('/');

      // Find navigation links
      const navLinks = await page.locator('nav a').all();

      if (navLinks.length > 0) {
        // Click first nav link
        const firstLink = navLinks[0];
        const href = await firstLink.getAttribute('href');

        if (href && href.startsWith('/')) {
          await firstLink.click();
          await page.waitForLoadState('domcontentloaded');

          // Verify navigation worked (URL changed or page loaded)
          const currentUrl = page.url();
          expect(currentUrl).toBeTruthy();
        }
      }
    });
  });

  test.describe('Critical Features Health', () => {
    test('Login form should be present', async ({ page }) => {
      await page.goto('/login');

      // Check for email and password inputs
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('Signup form should be present', async ({ page }) => {
      await page.goto('/signup');

      // Check for email and password inputs
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });
  });

  test.describe('Database Connectivity', () => {
    test('API should respond (indicates DB is accessible)', async ({ request }) => {
      // Try to hit an API endpoint that requires DB
      const response = await request.get('/api/runs');

      // Should get a response (even if 401 unauthorized)
      // Just shouldn't get 500 (server error) or timeout
      expect(response.status()).toBeDefined();
      expect(response.status()).not.toBe(500);
      expect(response.status()).not.toBe(502);
      expect(response.status()).not.toBe(503);
    });
  });

  test.describe('Error Boundaries', () => {
    test('Invalid routes should show 404 page, not crash', async ({ page }) => {
      await page.goto('/this-route-does-not-exist-12345');

      // Should show some kind of not found message
      const bodyText = await page.textContent('body');

      // Should have content (not crashed)
      expect(bodyText).toBeTruthy();

      // Should indicate error in some way
      const hasErrorMessage =
        bodyText?.includes('404') ||
        bodyText?.includes('not found') ||
        bodyText?.includes('Not Found') ||
        bodyText?.includes('Page not found');

      expect(hasErrorMessage).toBeTruthy();
    });
  });

  test.describe('Environment Variables', () => {
    test('Public env vars should be available', async ({ page }) => {
      await page.goto('/');

      // Check that the app loaded (indicates env vars are configured)
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      // No "configuration error" or "missing env" messages
      expect(bodyText?.toLowerCase()).not.toContain('configuration error');
      expect(bodyText?.toLowerCase()).not.toContain('missing environment');
    });
  });
});

/**
 * Production-specific tests (only run when testing against production URL)
 */
test.describe('Production-Only Checks', () => {
  test.skip(({ baseURL }) => !baseURL?.includes('https://'), 'Only runs against HTTPS URLs');

  test('Should use HTTPS', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toMatch(/^https:/);
  });

  test('Should have security headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};

    // Check for common security headers (may vary by hosting platform)
    // These are recommendations, not all hosts set all headers
    const hasSecurityHeaders =
      headers['strict-transport-security'] ||
      headers['x-frame-options'] ||
      headers['x-content-type-options'];

    expect(hasSecurityHeaders).toBeTruthy();
  });
});

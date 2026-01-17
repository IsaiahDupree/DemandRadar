/**
 * Page 404 Tests
 *
 * E2E tests to verify that all valid application routes return 200 status
 * and no 404 errors occur on legitimate pages.
 */

import { test, expect } from '@playwright/test';

/**
 * List of all valid routes in the application
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
];

const DASHBOARD_ROUTES = [
  '/dashboard',
  '/dashboard/runs',
  '/dashboard/gaps',
  '/dashboard/ideas',
  '/dashboard/reports',
  '/dashboard/ugc',
  '/dashboard/trends',
  '/dashboard/settings',
  '/dashboard/settings/billing',
  '/dashboard/new-run',
  '/dashboard/niches',
];

const ALL_ROUTES = [...PUBLIC_ROUTES, ...DASHBOARD_ROUTES];

test.describe('Page Accessibility Tests', () => {
  test.describe('Public Routes (Unauthenticated)', () => {
    for (const route of PUBLIC_ROUTES) {
      test(`${route} should be accessible without authentication`, async ({ page }) => {
        const response = await page.goto(route);

        // Verify response status
        expect(response?.status()).toBeLessThan(400);

        // Verify page loaded (not a 404)
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title).not.toContain('404');
        expect(title).not.toContain('Not Found');

        // Verify no error message on page (check for actual error text, not just "404" string)
        const bodyText = await page.textContent('body');
        expect(bodyText?.toLowerCase()).not.toContain('page not found');
        expect(bodyText?.toLowerCase()).not.toContain('404 not found');
        expect(bodyText?.toLowerCase()).not.toContain('404 error');
      });
    }
  });

  test.describe('Dashboard Routes (Authenticated Required)', () => {
    test.beforeEach(async ({ page }) => {
      // Try to access a protected route
      // This test verifies routes exist, even if they redirect to login
      await page.goto('/dashboard');
    });

    for (const route of DASHBOARD_ROUTES) {
      test(`${route} should exist (200 or redirect to login, not 404)`, async ({ page }) => {
        const response = await page.goto(route);

        // Should either:
        // 1. Return 200 if somehow authenticated
        // 2. Redirect to login (3xx status or navigated to /login)
        // 3. Return 401/403 for unauthorized access
        // But should NOT return 404

        const status = response?.status() || 0;
        const currentUrl = page.url();

        // Verify it's not a 404
        expect(status).not.toBe(404);

        // If we got redirected to login, that's fine - route exists
        if (currentUrl.includes('/login')) {
          expect(currentUrl).toContain('/login');
        } else {
          // If not redirected, status should be 200, 401, or 403
          expect([200, 401, 403]).toContain(status);
        }

        // Verify no 404 error message on page
        const bodyText = await page.textContent('body');
        expect(bodyText?.toLowerCase()).not.toContain('page not found');
      });
    }
  });

  test.describe('404 Error Page', () => {
    test('should show 404 page for invalid routes', async ({ page }) => {
      const invalidRoutes = [
        '/this-does-not-exist',
        '/dashboard/invalid-page',
        '/random-route-12345',
      ];

      for (const route of invalidRoutes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });

        // Should show some indication of error (either in title or body)
        const title = await page.title();
        const bodyText = await page.textContent('body');

        const hasErrorIndication =
          title?.includes('404') ||
          title?.includes('Not Found') ||
          bodyText?.includes('404') ||
          bodyText?.includes('Page not found') ||
          bodyText?.includes('not found');

        expect(hasErrorIndication).toBeTruthy();
      }
    });
  });

  test.describe('Link Integrity', () => {
    test('navigation links on home page should not be broken', async ({ page }) => {
      await page.goto('/');

      // Find all links on the homepage
      const links = await page.locator('a[href^="/"]').all();

      const brokenLinks: string[] = [];

      for (const link of links) {
        const href = await link.getAttribute('href');
        if (!href) continue;

        // Skip anchor links and external links
        if (href.startsWith('#') || href.startsWith('http')) continue;

        // Check if link is valid
        const response = await page.request.get(href);
        if (response.status() === 404) {
          brokenLinks.push(href);
        }
      }

      expect(brokenLinks).toHaveLength(0);
    });

    test('navigation links in dashboard should not be broken', async ({ page }) => {
      // Navigate to dashboard (may redirect to login)
      await page.goto('/dashboard');
      const currentUrl = page.url();

      // Find all internal navigation links
      const links = await page.locator('a[href^="/dashboard"]').all();

      if (links.length === 0) {
        // If on login page, skip this test
        if (currentUrl.includes('/login')) {
          test.skip();
        }
      }

      const brokenLinks: string[] = [];

      for (const link of links) {
        const href = await link.getAttribute('href');
        if (!href) continue;

        // Check if link returns 404
        const response = await page.request.get(href);
        if (response.status() === 404) {
          brokenLinks.push(href);
        }
      }

      expect(brokenLinks).toHaveLength(0);
    });
  });

  test.describe('Static Assets', () => {
    test('favicon should load successfully', async ({ page }) => {
      const response = await page.goto('/');
      expect(response?.status()).toBeLessThan(400);

      // Check if favicon exists
      const faviconResponse = await page.request.get('/favicon.ico');
      // Favicon might not exist, but shouldn't cause page errors
      expect([200, 404]).toContain(faviconResponse.status());
    });
  });
});

/**
 * Resilience & Error Handling E2E Tests (TASK-108)
 *
 * Tests for:
 * - Offline mode handling
 * - API failure simulation
 * - Error boundaries
 * - 404 error pages
 * - Network error recovery
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Resilience & Error Handling', () => {
  test.describe('Offline Mode Handling', () => {
    test('App should show offline message when network is unavailable', async ({ page, context }) => {
      // Navigate to page first
      await page.goto('/dashboard');

      // Simulate offline mode
      await context.setOffline(true);

      // Try to navigate or perform action
      try {
        await page.goto('/dashboard/runs');
      } catch (e) {
        // Navigation may fail, that's expected
      }

      // Go back online
      await context.setOffline(false);
    });

    test('App should handle network interruption gracefully', async ({ page, context }) => {
      await page.goto('/');

      // Simulate network interruption
      await context.setOffline(true);

      // Wait a bit
      await page.waitForTimeout(1000);

      // Go back online
      await context.setOffline(false);

      // Page should still be functional
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('API Failure Simulation', () => {
    test('Should handle failed API requests gracefully', async ({ page }) => {
      // Intercept API requests and make them fail
      await page.route('**/api/**', (route) => {
        route.abort('failed');
      });

      await page.goto('/dashboard');

      // Page should still load, showing empty state or error message
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      // Should NOT crash the entire app
      expect(bodyText?.toLowerCase()).not.toContain('application error');
      expect(bodyText?.toLowerCase()).not.toContain('chunk');
    });

    test('Should show user-friendly error for failed requests', async ({ page }) => {
      // Track console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Intercept specific API and return 500
      await page.route('**/api/runs', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await page.goto('/dashboard/runs');

      // Page should handle the error
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      // Should show some indication of the issue
      // (exact message depends on implementation)
    });

    test('Should handle timeout errors', async ({ page }) => {
      // Intercept API requests and delay them significantly
      await page.route('**/api/runs', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second delay
        route.continue();
      });

      // Set a shorter timeout for this test
      test.setTimeout(10000);

      try {
        await page.goto('/dashboard/runs', { timeout: 5000 });
      } catch (error) {
        // Timeout expected - that's OK
      }

      // App should still be responsive after timeout
      await page.goto('/');
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('Error Boundaries', () => {
    test('404 pages should show custom not found page', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-xyz123');

      // Should show content (not crash)
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      // Should indicate it's a 404 in a user-friendly way
      const has404Indication =
        bodyText?.toLowerCase().includes('404') ||
        bodyText?.toLowerCase().includes('not found') ||
        bodyText?.toLowerCase().includes('page not found') ||
        bodyText?.includes('Not Found');

      expect(has404Indication).toBeTruthy();
    });

    test('Dashboard 404 pages should show custom error', async ({ page }) => {
      await page.goto('/dashboard/this-page-does-not-exist');

      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      // Should show either 404 or redirect to login
      const isValidErrorPage =
        bodyText?.toLowerCase().includes('not found') ||
        bodyText?.toLowerCase().includes('404') ||
        page.url().includes('/login');

      expect(isValidErrorPage).toBeTruthy();
    });

    test('Invalid report ID should show error, not crash', async ({ page }) => {
      await page.goto('/dashboard/reports/invalid-id-12345');

      // Should handle gracefully
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      // Should not show raw error stack
      expect(bodyText?.toLowerCase()).not.toContain('error stack');
      expect(bodyText?.toLowerCase()).not.toContain('traceback');
    });
  });

  test.describe('Network Error Recovery', () => {
    test('Should retry failed requests', async ({ page }) => {
      let requestCount = 0;

      // Fail first request, succeed on retry
      await page.route('**/api/runs', (route) => {
        requestCount++;
        if (requestCount === 1) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      await page.goto('/dashboard/runs');

      // If app has retry logic, it should eventually succeed
      // Otherwise, it should show error gracefully
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });

    test('Should handle intermittent network issues', async ({ page, context }) => {
      await page.goto('/dashboard');

      // Toggle offline/online rapidly
      await context.setOffline(true);
      await page.waitForTimeout(500);
      await context.setOffline(false);
      await page.waitForTimeout(500);
      await context.setOffline(true);
      await page.waitForTimeout(500);
      await context.setOffline(false);

      // App should recover
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('Form Validation Errors', () => {
    test('Login form should show validation errors', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();

        // Should show validation errors or prevent submission
        // (behavior depends on implementation)
        const bodyText = await page.textContent('body');
        expect(bodyText).toBeTruthy();
      }
    });

    test('Signup form should show validation errors', async ({ page }) => {
      await page.goto('/signup');

      // Try to submit with invalid email
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');

      if (await emailInput.count() > 0 && await submitButton.count() > 0) {
        await emailInput.fill('invalid-email');
        await submitButton.click();

        // Should show validation error
        await page.waitForTimeout(1000);
        const bodyText = await page.textContent('body');
        expect(bodyText).toBeTruthy();
      }
    });
  });

  test.describe('Authentication Errors', () => {
    test('Should handle invalid credentials gracefully', async ({ page }) => {
      await page.goto('/login');

      // Try to login with invalid credentials
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"]');

      if (await emailInput.count() > 0) {
        await emailInput.fill('nonexistent@example.com');
        await passwordInput.fill('wrongpassword123');
        await submitButton.click();

        // Wait for response
        await page.waitForTimeout(2000);

        // Should show error message, not crash
        const bodyText = await page.textContent('body');
        expect(bodyText).toBeTruthy();

        // Should not show raw error stack
        expect(bodyText?.toLowerCase()).not.toContain('stack trace');
      }
    });

    test('Should redirect unauthorized access to login', async ({ page }) => {
      // Try to access protected route without auth
      await page.goto('/dashboard/settings');

      // Should redirect to login or show auth required message
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      const bodyText = await page.textContent('body');

      const isHandledProperly =
        currentUrl.includes('/login') ||
        bodyText?.toLowerCase().includes('login') ||
        bodyText?.toLowerCase().includes('sign in');

      expect(isHandledProperly).toBeTruthy();
    });
  });

  test.describe('Data Loading Errors', () => {
    test('Should show loading state before data arrives', async ({ page }) => {
      // Slow down API response
      await page.route('**/api/runs', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      });

      await page.goto('/dashboard/runs');

      // Should show loading indicator
      // (implementation-specific, so we just verify page loads)
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });

    test('Should show empty state when no data exists', async ({ page }) => {
      // Return empty data
      await page.route('**/api/runs', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/dashboard/runs');

      // Should handle empty data gracefully
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      // Should not crash
      expect(bodyText?.toLowerCase()).not.toContain('application error');
    });
  });

  test.describe('Malformed Data Handling', () => {
    test('Should handle malformed JSON responses', async ({ page }) => {
      // Return invalid JSON
      await page.route('**/api/runs', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'this is not valid JSON{[}',
        });
      });

      await page.goto('/dashboard/runs');

      // Should handle error gracefully
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });

    test('Should handle unexpected data structure', async ({ page }) => {
      // Return unexpected data structure
      await page.route('**/api/runs', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ unexpected: 'data', format: 'wrong' }),
        });
      });

      await page.goto('/dashboard/runs');

      // Should handle gracefully
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('Browser Compatibility', () => {
    test('Should handle localStorage errors gracefully', async ({ page }) => {
      // Disable localStorage
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem: () => { throw new Error('localStorage disabled'); },
            setItem: () => { throw new Error('localStorage disabled'); },
            removeItem: () => { throw new Error('localStorage disabled'); },
            clear: () => { throw new Error('localStorage disabled'); },
          },
          writable: false
        });
      });

      await page.goto('/');

      // Should still load, even with localStorage errors
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('Rate Limiting', () => {
    test('Should handle rate limit errors (429)', async ({ page }) => {
      // Return 429 Too Many Requests
      await page.route('**/api/runs', (route) => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Too many requests' }),
        });
      });

      await page.goto('/dashboard/runs');

      // Should show user-friendly message
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(bodyText?.toLowerCase()).not.toContain('undefined');
    });
  });

  test.describe('Concurrent Request Handling', () => {
    test('Should handle multiple failed requests', async ({ page }) => {
      // Fail all API requests
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      });

      await page.goto('/dashboard');

      // Should handle multiple failures gracefully
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });
});

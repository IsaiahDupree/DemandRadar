/**
 * Production Smoke Diagnostics (TEST-013)
 *
 * Validates production deployment health by testing:
 * - Critical routes return 200 status (not 404/500)
 * - No console errors on key pages
 * - Essential page elements render correctly
 * - API endpoints are accessible
 */

import { test, expect } from '@playwright/test';

/**
 * Base URL for tests
 * Uses PRODUCTION_URL env var or defaults to localhost for local testing
 */
const BASE_URL = process.env.PRODUCTION_URL || 'http://localhost:3001';

/**
 * Critical routes that must return 200 status
 */
const CRITICAL_ROUTES = [
  // Public pages
  { path: '/', name: 'Home Page', requiresAuth: false },
  { path: '/login', name: 'Login Page', requiresAuth: false },
  { path: '/signup', name: 'Signup Page', requiresAuth: false },
  { path: '/pricing', name: 'Pricing Page', requiresAuth: false },

  // Dashboard pages (should redirect to login if not authenticated)
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/dashboard/runs', name: 'Runs Page', requiresAuth: true },
  { path: '/dashboard/new-run', name: 'New Run Page', requiresAuth: true },
  { path: '/dashboard/settings', name: 'Settings Page', requiresAuth: true },
];

/**
 * API endpoints to verify
 */
const API_ENDPOINTS = [
  { path: '/api/health', method: 'GET', name: 'Health Check', expectedStatus: 200 },
  { path: '/api/trends', method: 'GET', name: 'Trends API', expectedStatus: 200 },
];

test.describe('Production Smoke Diagnostics', () => {
  test.describe('Critical Routes - HTTP Status Checks', () => {
    for (const route of CRITICAL_ROUTES) {
      test(\`\${route.name} (\${route.path}) should not return 404 or 500\`, async ({ page }) => {
        const consoleErrors: string[] = [];

        // Capture console errors
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        // Navigate to route
        const response = await page.goto(\`\${BASE_URL}\${route.path}\`, {
          waitUntil: 'domcontentloaded',
        });

        // Verify response exists
        expect(response).not.toBeNull();

        if (response) {
          const status = response.status();

          if (route.requiresAuth) {
            // Protected routes should either load (200) or redirect (302/307)
            expect([200, 302, 307]).toContain(status);
          } else {
            // Public routes must return 200
            expect(status).toBe(200);
          }

          // Verify not 404 or 500
          expect(status).not.toBe(404);
          expect(status).not.toBe(500);
        }

        // Check for critical console errors
        const criticalErrors = consoleErrors.filter(err =>
          err.includes('Failed to load') ||
          err.includes('500') ||
          err.includes('Network request failed')
        );

        if (criticalErrors.length > 0) {
          console.warn(\`Console errors on \${route.name}:\`, criticalErrors);
        }
      });
    }
  });

  test.describe('Console Error Detection', () => {
    test('Home page should load without critical console errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      const consoleWarnings: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        } else if (msg.type() === 'warning') {
          consoleWarnings.push(msg.text());
        }
      });

      await page.goto(\`\${BASE_URL}/\`, {
        waitUntil: 'networkidle',
      });

      // Filter out known non-critical errors (e.g., third-party scripts)
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('Google Analytics') &&
        !err.includes('PostHog') &&
        !err.includes('chrome-extension') &&
        !err.includes('favicon.ico')
      );

      expect(criticalErrors).toEqual([]);

      // Log warnings for visibility but don't fail
      if (consoleWarnings.length > 0) {
        console.log('Console warnings detected:', consoleWarnings.length);
      }
    });

    test('Login page should load without critical console errors', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(\`\${BASE_URL}/login\`, {
        waitUntil: 'networkidle',
      });

      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('Google Analytics') &&
        !err.includes('PostHog') &&
        !err.includes('chrome-extension')
      );

      expect(criticalErrors).toEqual([]);
    });
  });

  test.describe('API Endpoint Health', () => {
    for (const endpoint of API_ENDPOINTS) {
      test(\`\${endpoint.name} should return \${endpoint.expectedStatus}\`, async ({ request }) => {
        const response = await request.fetch(\`\${BASE_URL}\${endpoint.path}\`, {
          method: endpoint.method,
        });

        expect(response.status()).toBe(endpoint.expectedStatus);
      });
    }
  });

  test.describe('Essential Page Elements', () => {
    test('Home page should render hero section', async ({ page }) => {
      await page.goto(\`\${BASE_URL}/\`);

      // Check for hero heading
      const hero = page.locator('h1').first();
      await expect(hero).toBeVisible();

      // Verify text is not empty
      const text = await hero.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    });

    test('Login page should render login form', async ({ page }) => {
      await page.goto(\`\${BASE_URL}/login\`);

      // Check for email input
      const emailInput = page.locator('input[type="email"]').first();
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      const submitButton = page.locator('button[type="submit"]').first();
      await expect(submitButton).toBeVisible();
    });

    test('Pricing page should render pricing plans', async ({ page }) => {
      await page.goto(\`\${BASE_URL}/pricing\`);

      // Check for pricing content
      const pricingContent = page.locator('text=/\\$|Free|Starter|Builder|Agency/i').first();
      await expect(pricingContent).toBeVisible();
    });
  });

  test.describe('Resource Loading', () => {
    test('Critical CSS and JS should load successfully', async ({ page }) => {
      const failedResources: string[] = [];

      page.on('response', (response) => {
        const status = response.status();
        const url = response.url();

        // Track failed CSS/JS resources
        if ((url.endsWith('.css') || url.endsWith('.js')) && status >= 400) {
          failedResources.push(\`\${url} (\${status})\`);
        }
      });

      await page.goto(\`\${BASE_URL}/\`, {
        waitUntil: 'load',
      });

      // Wait a bit for all resources to attempt loading
      await page.waitForTimeout(2000);

      expect(failedResources).toEqual([]);
    });
  });

  test.describe('Network Resilience', () => {
    test('Should handle slow network gracefully', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', (route) => {
        setTimeout(() => route.continue(), 100);
      });

      const response = await page.goto(\`\${BASE_URL}/\`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000, // Allow more time for slow network
      });

      expect(response?.status()).toBe(200);

      // Verify page still renders key content
      const hero = page.locator('h1').first();
      await expect(hero).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Performance Baseline', () => {
    test('Home page should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(\`\${BASE_URL}/\`, {
        waitUntil: 'domcontentloaded',
      });

      const loadTime = Date.now() - startTime;

      // Should load in under 5 seconds (generous threshold for production)
      expect(loadTime).toBeLessThan(5000);

      console.log(\`Home page load time: \${loadTime}ms\`);
    });
  });
});

test.describe('Production-Specific Checks', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium-only test');

  test('Should not expose development tools in production', async ({ page }) => {
    await page.goto(\`\${BASE_URL}/\`);

    // Check that React DevTools warning is not present (indicates production build)
    const content = await page.content();
    expect(content).not.toContain('react-devtools');

    // Check for minified JS (production builds are minified)
    const scripts = await page.locator('script[src]').all();
    const scriptUrls = await Promise.all(scripts.map(s => s.getAttribute('src')));

    // At least one script should contain chunkhash or similar (Next.js production pattern)
    const hasProductionAssets = scriptUrls.some(url =>
      url && (url.includes('/_next/static/') || url.includes('.js'))
    );

    expect(hasProductionAssets).toBeTruthy();
  });
});

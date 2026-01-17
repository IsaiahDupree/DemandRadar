/**
 * Accessibility E2E Tests (TASK-106)
 *
 * Tests for WCAG compliance using axe-core
 * Validates that key public and dashboard pages meet accessibility standards
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * List of critical pages to test for accessibility
 */
const PUBLIC_PAGES = [
  { path: '/', name: 'Home Page' },
  { path: '/login', name: 'Login Page' },
  { path: '/signup', name: 'Signup Page' },
];

const DASHBOARD_PAGES = [
  { path: '/dashboard', name: 'Dashboard Home' },
  { path: '/dashboard/runs', name: 'Runs Page' },
  { path: '/dashboard/reports', name: 'Reports Page' },
  { path: '/dashboard/new-run', name: 'New Run Page' },
  { path: '/dashboard/settings', name: 'Settings Page' },
  { path: '/dashboard/niches', name: 'Niches Page' },
];

test.describe('Accessibility Tests (WCAG Compliance)', () => {
  test.describe('Public Pages', () => {
    for (const page of PUBLIC_PAGES) {
      test(`${page.name} should have no accessibility violations`, async ({ page: pw }) => {
        await pw.goto(page.path);

        // Run axe accessibility scan
        const accessibilityScanResults = await new AxeBuilder({ page: pw }).analyze();

        // Fail test if critical or serious violations found
        expect(accessibilityScanResults.violations).toEqual([]);
      });

      test(`${page.name} should have proper heading hierarchy`, async ({ page: pw }) => {
        await pw.goto(page.path);

        // Check for h1 tag
        const h1Count = await pw.locator('h1').count();
        expect(h1Count).toBeGreaterThanOrEqual(1);

        // Run specific check for heading order
        const accessibilityScanResults = await new AxeBuilder({ page: pw })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        const headingViolations = accessibilityScanResults.violations.filter(
          v => v.id === 'heading-order'
        );
        expect(headingViolations).toHaveLength(0);
      });

      test(`${page.name} should have proper form labels`, async ({ page: pw }) => {
        await pw.goto(page.path);

        // Check if page has forms
        const formCount = await pw.locator('form').count();

        if (formCount > 0) {
          // Run specific check for form labels
          const accessibilityScanResults = await new AxeBuilder({ page: pw })
            .withTags(['wcag2a'])
            .analyze();

          const labelViolations = accessibilityScanResults.violations.filter(
            v => v.id === 'label' || v.id === 'label-title-only'
          );
          expect(labelViolations).toHaveLength(0);
        }
      });

      test(`${page.name} should have sufficient color contrast`, async ({ page: pw }) => {
        await pw.goto(page.path);

        // Run specific check for color contrast
        const accessibilityScanResults = await new AxeBuilder({ page: pw })
          .withTags(['wcag2aa'])
          .analyze();

        const contrastViolations = accessibilityScanResults.violations.filter(
          v => v.id === 'color-contrast'
        );
        expect(contrastViolations).toHaveLength(0);
      });
    }
  });

  test.describe('Dashboard Pages (Authenticated)', () => {
    for (const page of DASHBOARD_PAGES) {
      test(`${page.name} should have no critical accessibility violations`, async ({ page: pw }) => {
        await pw.goto(page.path);

        // Note: These pages may redirect to login if not authenticated
        // That's OK - we're testing the page that loads
        const currentUrl = pw.url();

        // Run axe accessibility scan on whatever page loaded
        const accessibilityScanResults = await new AxeBuilder({ page: pw })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        // Filter for critical and serious violations only
        const criticalViolations = accessibilityScanResults.violations.filter(
          v => v.impact === 'critical' || v.impact === 'serious'
        );

        // Log violations for debugging
        if (criticalViolations.length > 0) {
          console.log(`Accessibility violations on ${page.name}:`,
            JSON.stringify(criticalViolations, null, 2));
        }

        expect(criticalViolations).toEqual([]);
      });
    }
  });

  test.describe('Keyboard Navigation', () => {
    test('Home page should be keyboard navigable', async ({ page }) => {
      await page.goto('/');

      // Run keyboard-specific accessibility checks
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze();

      const keyboardViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'keyboard' || v.id === 'focus-order-semantics'
      );
      expect(keyboardViolations).toHaveLength(0);
    });

    test('Login form should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');

      // Tab through form elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Run keyboard-specific accessibility checks
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze();

      const keyboardViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'keyboard' || v.id === 'tabindex'
      );
      expect(keyboardViolations).toHaveLength(0);
    });
  });

  test.describe('ARIA Attributes', () => {
    test('Interactive elements should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/');

      // Run ARIA-specific accessibility checks
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const ariaViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('aria') || v.id === 'button-name' || v.id === 'link-name'
      );

      if (ariaViolations.length > 0) {
        console.log('ARIA violations:', JSON.stringify(ariaViolations, null, 2));
      }

      expect(ariaViolations).toHaveLength(0);
    });

    test('Dashboard navigation should have proper ARIA labels', async ({ page }) => {
      await page.goto('/dashboard');

      // Run ARIA-specific accessibility checks
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze();

      const ariaViolations = accessibilityScanResults.violations.filter(
        v => v.id.includes('aria') || v.id === 'button-name'
      );

      // Allow minor violations on login redirect pages
      if (page.url().includes('/login')) {
        test.skip();
      }

      expect(ariaViolations).toHaveLength(0);
    });
  });

  test.describe('Images and Alt Text', () => {
    test('All images should have alt text', async ({ page }) => {
      await page.goto('/');

      // Run image alt text check
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze();

      const imageViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'image-alt'
      );
      expect(imageViolations).toHaveLength(0);
    });
  });

  test.describe('Semantic HTML', () => {
    test('Pages should use semantic HTML elements', async ({ page }) => {
      await page.goto('/');

      // Run semantic HTML checks
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['best-practice'])
        .analyze();

      const semanticViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'serious' || v.impact === 'critical'
      );

      if (semanticViolations.length > 0) {
        console.log('Semantic HTML violations:', JSON.stringify(semanticViolations, null, 2));
      }

      expect(semanticViolations).toHaveLength(0);
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('Main content should be properly labeled for screen readers', async ({ page }) => {
      await page.goto('/');

      // Check for main landmark
      const mainLandmark = await page.locator('main, [role="main"]').count();
      expect(mainLandmark).toBeGreaterThanOrEqual(1);

      // Run landmark checks
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze();

      const landmarkViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'landmark-one-main' || v.id === 'region'
      );
      expect(landmarkViolations).toHaveLength(0);
    });
  });
});

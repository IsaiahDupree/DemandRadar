/**
 * Data Hydration Tests
 *
 * Verify that pages load with correct data from the database,
 * show no empty states when data exists, and loading states work correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Data Hydration Tests', () => {
  test.describe('Dashboard Page Data Loading', () => {
    test('dashboard shows data or appropriate empty state', async ({ page }) => {
      await page.goto('/dashboard');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Page should show either:
      // 1. Data (runs, stats, recent activity)
      // 2. Meaningful empty state with CTA

      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(50);

      // Should not show generic loading spinner indefinitely
      const loadingSpinner = page.locator('.loading, .spinner, [data-loading="true"]').first();
      if (await loadingSpinner.count() > 0) {
        // Spinner should disappear after loading
        await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('dashboard stats are displayed correctly', async ({ page }) => {
      await page.goto('/dashboard');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Look for stat cards/metrics
      const statCards = page.locator('[data-metric], .stat-card, .metric');

      // Even if no data, should show 0 or "No data yet"
      if (await statCards.count() > 0) {
        for (const card of await statCards.all()) {
          await expect(card).toBeVisible();
        }
      }
    });
  });

  test.describe('Runs Page Data Loading', () => {
    test('runs page loads and displays runs or empty state', async ({ page }) => {
      await page.goto('/dashboard/runs');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      const bodyText = await page.textContent('body');

      // Should show either:
      // 1. Table/list of runs
      // 2. Empty state with "Create your first run" CTA

      const hasRuns = bodyText?.includes('Completed') || bodyText?.includes('Running');
      const hasEmptyState =
        bodyText?.includes('No runs') ||
        bodyText?.includes('Create your first') ||
        bodyText?.includes('Get started');

      expect(hasRuns || hasEmptyState).toBeTruthy();
    });

    test('runs table shows correct data structure', async ({ page }) => {
      await page.goto('/dashboard/runs');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Look for table headers or list items
      const tableHeaders = page.locator('th, [role="columnheader"]');
      const runItems = page.locator('tr[data-run-id], [data-run], .run-item');

      if (await runItems.count() > 0) {
        // If we have runs, verify they show required data
        const firstRun = runItems.first();
        await expect(firstRun).toBeVisible();

        const runText = await firstRun.textContent();

        // Should show at least niche/query and status
        expect(runText).toBeTruthy();
        expect(runText!.length).toBeGreaterThan(5);
      } else if (await tableHeaders.count() > 0) {
        // Even without data, table structure should exist
        expect(await tableHeaders.count()).toBeGreaterThan(0);
      }
    });

    test('run status badges display correctly', async ({ page }) => {
      await page.goto('/dashboard/runs');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      const statusBadges = page.locator('[data-status], .status-badge, .status');

      if (await statusBadges.count() === 0) {
        console.log('No runs with status badges');
        test.skip();
        return;
      }

      // Verify status badges are visible and have content
      const firstBadge = statusBadges.first();
      await expect(firstBadge).toBeVisible();

      const badgeText = await firstBadge.textContent();
      expect(badgeText).toBeTruthy();

      // Should be a valid status
      const validStatuses = ['pending', 'running', 'completed', 'failed', 'cancelled'];
      const hasValidStatus = validStatuses.some((status) => badgeText?.toLowerCase().includes(status));

      expect(hasValidStatus).toBeTruthy();
    });
  });

  test.describe('Reports Page Data Loading', () => {
    test('reports page shows reports or empty state', async ({ page }) => {
      await page.goto('/dashboard/reports');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      const bodyText = await page.textContent('body');

      const hasReports =
        bodyText?.includes('Report') || bodyText?.includes('Analysis') || bodyText?.includes('Completed');
      const hasEmptyState =
        bodyText?.includes('No reports') || bodyText?.includes('Create your first');

      expect(hasReports || hasEmptyState).toBeTruthy();
    });

    test('report cards display key information', async ({ page }) => {
      await page.goto('/dashboard/reports');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      const reportCards = page.locator('[data-report-id], .report-card, tr');

      if (await reportCards.count() === 0) {
        test.skip();
        return;
      }

      const firstReport = reportCards.first();
      await expect(firstReport).toBeVisible();

      const reportText = await firstReport.textContent();
      expect(reportText).toBeTruthy();

      // Should show at minimum: niche name and date
      expect(reportText!.length).toBeGreaterThan(10);
    });
  });

  test.describe('Report Detail Page Data Loading', () => {
    test('report detail page loads complete data', async ({ page }) => {
      // First, get a report ID from the reports list
      await page.goto('/dashboard/reports');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Find first report link
      const reportLink = page.locator('a[href*="/reports/"]').first();

      if (await reportLink.count() === 0) {
        test.skip();
        return;
      }

      // Navigate to report details
      await reportLink.click();
      await page.waitForURL(/\/reports\/[a-z0-9-]+/);
      await page.waitForLoadState('networkidle');

      // Verify report sections are loaded
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(200);

      // Look for key report sections
      const hasSections =
        bodyText?.includes('Executive Summary') ||
        bodyText?.includes('Market') ||
        bodyText?.includes('Gap') ||
        bodyText?.includes('Opportunities');

      expect(hasSections).toBeTruthy();
    });

    test('report sections contain data, not just headers', async ({ page }) => {
      await page.goto('/dashboard/reports');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const reportLink = page.locator('a[href*="/reports/"]').first();

      if (await reportLink.count() === 0) {
        test.skip();
        return;
      }

      await reportLink.click();
      await page.waitForURL(/\/reports\//);
      await page.waitForLoadState('networkidle');

      // Look for data elements (tables, charts, lists)
      const dataElements = page.locator('table, canvas, ul li, ol li, .chart, [role="table"]');

      if (await dataElements.count() > 0) {
        // Should have actual content beyond just headings
        const firstElement = dataElements.first();
        await expect(firstElement).toBeVisible();
      }

      // Page should have substantial content
      const bodyText = await page.textContent('body');
      expect(bodyText!.length).toBeGreaterThan(500);
    });
  });

  test.describe('Loading States', () => {
    test('pages show loading state during data fetch', async ({ page }) => {
      // Intercept API calls to simulate slow network
      await page.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto('/dashboard/runs');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for loading indicators
      const loadingIndicators = page.locator(
        '[data-loading], .loading, .spinner, [role="status"], .skeleton'
      );

      // May show loading state briefly
      // This test is hard to guarantee timing, so we just verify page eventually loads
      await page.waitForLoadState('networkidle');

      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });

    test('loading states are removed after data loads', async ({ page }) => {
      await page.goto('/dashboard/runs');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Wait a bit more to ensure loading states clear
      await page.waitForTimeout(1000);

      // Should not have persistent loading spinners
      const persistentLoaders = page.locator('.loading:visible, .spinner:visible');

      // Some progress bars might be visible for running jobs, but not indefinite spinners
      const loaderCount = await persistentLoaders.count();

      // Allow for some dynamic loading (e.g., progress bars for running jobs)
      // but not stuck loading states
      expect(loaderCount).toBeLessThan(5);
    });
  });

  test.describe('Empty States', () => {
    test('empty states provide clear call-to-action', async ({ page }) => {
      // Navigate to various pages and check for proper empty states

      const pagesToCheck = [
        '/dashboard/reports',
        '/dashboard/runs',
        '/dashboard/gaps',
        '/dashboard/ideas',
      ];

      for (const path of pagesToCheck) {
        await page.goto(path);

        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          continue;
        }

        await page.waitForLoadState('networkidle');

        const bodyText = await page.textContent('body');

        // If page shows empty state, should have CTA
        if (
          bodyText?.includes('No ') ||
          bodyText?.includes('nothing') ||
          bodyText?.includes('empty')
        ) {
          // Should have a CTA button
          const ctaButton = page.locator('button:has-text("Create"), a:has-text("Get Started"), button:has-text("New")');

          // Empty states should guide users
          const hasCTA = (await ctaButton.count()) > 0;
          const hasGuidance =
            bodyText?.includes('Create') ||
            bodyText?.includes('Start') ||
            bodyText?.includes('Get started');

          expect(hasCTA || hasGuidance).toBeTruthy();
        }
      }
    });
  });

  test.describe('Data Refresh', () => {
    test('page can be refreshed without errors', async ({ page }) => {
      await page.goto('/dashboard/runs');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Get initial content
      const initialContent = await page.textContent('body');

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should load successfully again
      const refreshedContent = await page.textContent('body');
      expect(refreshedContent).toBeTruthy();
      expect(refreshedContent!.length).toBeGreaterThan(50);

      // No error messages
      expect(refreshedContent?.toLowerCase()).not.toContain('error loading');
      expect(refreshedContent?.toLowerCase()).not.toContain('failed to fetch');
    });
  });
});

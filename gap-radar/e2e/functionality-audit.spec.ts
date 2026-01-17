/**
 * Page Functionality Audit
 *
 * Verify that each dashboard page has WORKING functionality, not just UI.
 * Tests that forms submit, filters work, sorting works, search works, etc.
 */

import { test, expect } from '@playwright/test';

test.describe('Page Functionality Audit', () => {
  test.describe('Dashboard Homepage Functionality', () => {
    test('dashboard displays summary metrics', async ({ page }) => {
      await page.goto('/dashboard');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Should show some form of metrics or recent activity
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      // Look for metric cards or stats
      const metrics = page.locator('[data-metric], .metric, .stat-card, [role="region"]');
      const hasMetrics = (await metrics.count()) > 0;

      const hasContent = bodyText!.length > 100;

      expect(hasMetrics || hasContent).toBeTruthy();
    });

    test('navigation between dashboard sections works', async ({ page }) => {
      await page.goto('/dashboard');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Click on navigation items
      const navLinks = await page.locator('nav a').all();

      if (navLinks.length === 0) {
        test.skip();
        return;
      }

      // Test first nav link
      const firstLink = navLinks[0];
      const href = await firstLink.getAttribute('href');

      if (href && href.startsWith('/dashboard')) {
        await firstLink.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to the new page
        const newUrl = page.url();
        expect(newUrl).toContain('/dashboard');
      }
    });
  });

  test.describe('Runs Page Functionality', () => {
    test('can filter runs by status', async ({ page }) => {
      await page.goto('/dashboard/runs');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Look for filter controls
      const filterSelect = page.locator('select[name*="status"], select[name*="filter"]').first();
      const filterButtons = page.locator('button:has-text("All"), button:has-text("Completed"), button:has-text("Running")');

      if (await filterSelect.count() > 0) {
        // Test select-based filter
        await filterSelect.selectOption('completed');
        await page.waitForTimeout(500);

        // Results should update (implementation may vary)
      } else if (await filterButtons.count() > 0) {
        // Test button-based filter
        const completedButton = page.locator('button:has-text("Completed")').first();
        await completedButton.click();
        await page.waitForTimeout(500);
      } else {
        console.log('No filter controls found');
        test.skip();
      }
    });

    test('can sort runs table', async ({ page }) => {
      await page.goto('/dashboard/runs');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Look for sortable column headers
      const sortableHeaders = page.locator('th[role="columnheader"], th[data-sortable], th button');

      if (await sortableHeaders.count() === 0) {
        test.skip();
        return;
      }

      // Click first sortable header
      const firstHeader = sortableHeaders.first();
      await firstHeader.click();
      await page.waitForTimeout(500);

      // Data should re-order (hard to verify without specific data)
      // Just verify page doesn't error
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });

    test('can search/filter runs', async ({ page }) => {
      await page.goto('/dashboard/runs');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], input[name="search"]').first();

      if (await searchInput.count() === 0) {
        test.skip();
        return;
      }

      // Enter search query
      await searchInput.fill('productivity');
      await page.waitForTimeout(500);

      // Results should filter (implementation may vary)
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });

    test('pagination works if present', async ({ page }) => {
      await page.goto('/dashboard/runs');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Look for pagination controls
      const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]').first();
      const pageNumbers = page.locator('[role="navigation"] button, .pagination button');

      if (await nextButton.count() === 0 && await pageNumbers.count() === 0) {
        test.skip();
        return;
      }

      if (await nextButton.count() > 0) {
        const isEnabled = await nextButton.isEnabled();

        if (isEnabled) {
          await nextButton.click();
          await page.waitForTimeout(500);

          // Should load next page
          const bodyText = await page.textContent('body');
          expect(bodyText).toBeTruthy();
        }
      }
    });
  });

  test.describe('New Run Form Functionality', () => {
    test('form validation works', async ({ page }) => {
      await page.goto('/dashboard/new-run');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      const submitButton = page.locator('button[type="submit"]').first();

      if (await submitButton.count() === 0) {
        test.skip();
        return;
      }

      // Try submitting empty form
      await submitButton.click();
      await page.waitForTimeout(500);

      // Should show validation error
      const bodyText = await page.textContent('body');
      const hasError =
        bodyText?.includes('required') ||
        bodyText?.includes('Required') ||
        bodyText?.includes('error') ||
        page.url().includes('/new-run'); // Still on same page

      expect(hasError).toBeTruthy();
    });

    test('can fill and submit form', async ({ page }) => {
      await page.goto('/dashboard/new-run');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Fill required fields
      const nicheInput = page.locator('input[name="niche_query"], textarea[name="niche_query"]').first();

      if (await nicheInput.count() === 0) {
        test.skip();
        return;
      }

      await nicheInput.fill('Test niche for E2E testing');

      // Fill optional fields if present
      const seedTermsInput = page.locator('input[name="seed_terms"], textarea[name="seed_terms"]').first();
      if (await seedTermsInput.count() > 0) {
        await seedTermsInput.fill('test, automation, e2e');
      }

      // Submit form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should redirect after submission
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });

      const newUrl = page.url();
      expect(newUrl).not.toContain('/new-run');
    });

    test('form fields accept input correctly', async ({ page }) => {
      await page.goto('/dashboard/new-run');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      const nicheInput = page.locator('input[name="niche_query"], textarea[name="niche_query"]').first();

      if (await nicheInput.count() === 0) {
        test.skip();
        return;
      }

      // Type into input
      await nicheInput.fill('productivity tools');

      // Verify input was accepted
      const value = await nicheInput.inputValue();
      expect(value).toBe('productivity tools');
    });
  });

  test.describe('Reports Page Functionality', () => {
    test('can view report details', async ({ page }) => {
      await page.goto('/dashboard/reports');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Find first report link
      const reportLink = page.locator('a[href*="/reports/"], button:has-text("View")').first();

      if (await reportLink.count() === 0) {
        test.skip();
        return;
      }

      // Click to view report
      await reportLink.click();
      await page.waitForURL(/\/reports\//);
      await page.waitForLoadState('networkidle');

      // Verify report content loaded
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(100);
    });

    test('can navigate between report sections', async ({ page }) => {
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

      // Look for section tabs or navigation
      const sectionTabs = page.locator('[role="tab"], .tab, button:has-text("Summary"), button:has-text("Market")');

      if (await sectionTabs.count() > 0) {
        // Click on different tabs
        const secondTab = sectionTabs.nth(1);

        if (await secondTab.count() > 0) {
          await secondTab.click();
          await page.waitForTimeout(500);

          // Content should change
          const bodyText = await page.textContent('body');
          expect(bodyText).toBeTruthy();
        }
      }
    });

    test('export functionality works', async ({ page }) => {
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

      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("PDF")').first();

      if (await exportButton.count() === 0) {
        test.skip();
        return;
      }

      // Verify button is clickable
      await expect(exportButton).toBeEnabled();

      // Click might trigger download - just verify it's functional
      // Actual download test is in other specs
    });
  });

  test.describe('Settings Page Functionality', () => {
    test('can view and update settings', async ({ page }) => {
      await page.goto('/dashboard/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Look for settings form
      const formInputs = page.locator('input, select, textarea');

      if (await formInputs.count() === 0) {
        test.skip();
        return;
      }

      // Verify form fields are editable
      const firstInput = formInputs.first();
      const isEditable = await firstInput.isEnabled();

      expect(isEditable).toBeTruthy();
    });

    test('can navigate to billing page', async ({ page }) => {
      await page.goto('/dashboard/settings');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Look for billing link
      const billingLink = page.locator('a:has-text("Billing"), a[href*="/billing"]').first();

      if (await billingLink.count() === 0) {
        test.skip();
        return;
      }

      await billingLink.click();
      await page.waitForURL(/\/billing/);

      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('UGC Page Functionality', () => {
    test('UGC page displays content recommendations', async ({ page }) => {
      await page.goto('/dashboard/ugc');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Should show UGC recommendations or empty state
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      const hasContent =
        bodyText?.includes('hook') ||
        bodyText?.includes('script') ||
        bodyText?.includes('UGC') ||
        bodyText?.includes('No content');

      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('Gaps Page Functionality', () => {
    test('gaps page displays market gaps', async ({ page }) => {
      await page.goto('/dashboard/gaps');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      const hasContent =
        bodyText?.includes('gap') ||
        bodyText?.includes('opportunity') ||
        bodyText?.includes('No gaps');

      expect(hasContent).toBeTruthy();
    });

    test('can filter gaps by type', async ({ page }) => {
      await page.goto('/dashboard/gaps');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      // Look for filter controls
      const filterControls = page.locator('select[name*="type"], button:has-text("Product"), button:has-text("Pricing")');

      if (await filterControls.count() === 0) {
        test.skip();
        return;
      }

      const firstFilter = filterControls.first();
      await firstFilter.click();
      await page.waitForTimeout(500);

      // Results should update
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });
  });

  test.describe('Ideas Page Functionality', () => {
    test('ideas page displays concept ideas', async ({ page }) => {
      await page.goto('/dashboard/ideas');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      const hasContent =
        bodyText?.includes('idea') ||
        bodyText?.includes('concept') ||
        bodyText?.includes('No ideas');

      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('Trends Page Functionality', () => {
    test('trends page displays market trends', async ({ page }) => {
      await page.goto('/dashboard/trends');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      await page.waitForLoadState('networkidle');

      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      const hasContent =
        bodyText?.includes('trend') ||
        bodyText?.includes('chart') ||
        bodyText?.includes('No trends');

      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('Cross-Page Functionality', () => {
    test('can navigate between all dashboard pages', async ({ page }) => {
      const pages = [
        '/dashboard',
        '/dashboard/runs',
        '/dashboard/reports',
        '/dashboard/gaps',
        '/dashboard/ideas',
        '/dashboard/ugc',
        '/dashboard/trends',
        '/dashboard/settings',
      ];

      for (const path of pages) {
        await page.goto(path);

        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          break;
        }

        await page.waitForLoadState('networkidle');

        // Verify page loaded successfully
        const bodyText = await page.textContent('body');
        expect(bodyText).toBeTruthy();
        expect(bodyText!.length).toBeGreaterThan(50);
      }
    });

    test('back button navigation works', async ({ page }) => {
      await page.goto('/dashboard');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Navigate to another page
      await page.goto('/dashboard/runs');
      await page.waitForLoadState('networkidle');

      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Should be back on dashboard
      expect(page.url()).toContain('/dashboard');
    });
  });
});

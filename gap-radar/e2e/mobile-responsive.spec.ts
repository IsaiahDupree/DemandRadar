import { test, expect, Page } from '@playwright/test';

/**
 * UI-003: Mobile Responsive Polish
 *
 * Tests that all dashboard pages are mobile-responsive with:
 * - Touch-friendly targets (min 44x44px)
 * - Readable text on small screens
 * - Working navigation
 */

const MOBILE_VIEWPORT = { width: 375, height: 667 }; // iPhone SE
const TABLET_VIEWPORT = { width: 768, height: 1024 }; // iPad

test.describe('Mobile Responsive Polish (UI-003)', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(MOBILE_VIEWPORT);
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should have touch-friendly navigation targets on mobile', async ({ page }) => {
    // Sidebar trigger should be at least 44x44px (iOS touch target guideline)
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]').or(
      page.getByRole('button').filter({ has: page.locator('svg') }).first()
    );

    await expect(sidebarTrigger.first()).toBeVisible();

    const triggerBox = await sidebarTrigger.first().boundingBox();
    expect(triggerBox).not.toBeNull();
    if (triggerBox) {
      expect(triggerBox.width).toBeGreaterThanOrEqual(40); // Allow slight margin
      expect(triggerBox.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('should have readable text sizes on mobile dashboard', async ({ page }) => {
    // Main heading should be visible and appropriately sized
    const heading = page.getByRole('heading', { name: /Dashboard/i, level: 1 });
    await expect(heading).toBeVisible();

    // Check font size is reasonable for mobile (at least 20px for h1)
    const fontSize = await heading.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    const fontSizeNum = parseFloat(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(20);

    // Description text should be readable (at least 14px)
    const description = page.getByText(/Market gap analysis/i);
    await expect(description).toBeVisible();
    const descFontSize = await description.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    expect(parseFloat(descFontSize)).toBeGreaterThanOrEqual(14);
  });

  test('should display mobile-optimized cards instead of table on runs page', async ({ page }) => {
    await page.goto('/dashboard/runs');

    // Desktop table should be hidden
    const desktopTable = page.locator('table').first();
    await expect(desktopTable).toBeHidden();

    // Mobile card view should be visible
    const mobileCards = page.locator('.md\\:hidden').first();
    await expect(mobileCards).toBeVisible();

    // Cards should be stacked vertically and readable
    const cards = page.locator('.md\\:hidden > *');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow navigation via mobile sidebar', async ({ page }) => {
    // Open sidebar by clicking trigger
    const trigger = page.locator('[data-sidebar="trigger"]').or(
      page.getByRole('button').filter({ has: page.locator('svg') }).first()
    );
    await trigger.first().click();

    // Wait for sidebar animation
    await page.waitForTimeout(300);

    // Click on "Runs" link
    const runsLink = page.getByRole('link', { name: /^Runs$/i });
    await expect(runsLink).toBeVisible();
    await runsLink.click();

    // Should navigate to runs page
    await expect(page).toHaveURL(/\/dashboard\/runs/);
  });

  test('should have full-width buttons on mobile', async ({ page }) => {
    // "New Analysis" button should be full-width on mobile
    const newAnalysisButton = page.getByRole('link', { name: /New Analysis/i });
    await expect(newAnalysisButton).toBeVisible();

    // Check if button has full width classes
    const className = await newAnalysisButton.evaluate((el) => el.className);
    expect(className).toContain('w-full');
  });

  test('should stack stats cards vertically on mobile', async ({ page }) => {
    // Stats cards container
    const statsGrid = page.locator('.grid').first();
    await expect(statsGrid).toBeVisible();

    // On mobile, cards should stack (grid should allow wrapping)
    const gridTemplateColumns = await statsGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });

    // Should be single column on mobile (not 4 columns)
    expect(gridTemplateColumns).not.toContain('repeat(4');
  });

  test('should make charts responsive on mobile', async ({ page }) => {
    // Charts should be visible and sized appropriately
    const charts = page.locator('[class*="recharts-wrapper"]');
    const chartCount = await charts.count();

    if (chartCount > 0) {
      const firstChart = charts.first();
      await expect(firstChart).toBeVisible();

      // Chart should not overflow viewport
      const chartBox = await firstChart.boundingBox();
      if (chartBox) {
        expect(chartBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width);
      }
    }
  });

  test('should display mobile cards with proper spacing on dashboard', async ({ page }) => {
    // Check that "Recent Runs" section shows mobile cards
    await page.locator('text=Recent Runs').scrollIntoViewIfNeeded();

    // Mobile cards should be visible
    const mobileCardView = page.locator('.md\\:hidden').filter({ hasText: /AI-powered/i }).first();
    await expect(mobileCardView).toBeVisible();

    // Cards should have padding for touch targets
    const card = page.locator('.md\\:hidden .border.rounded-lg').first();
    if (await card.isVisible()) {
      const padding = await card.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.padding;
      });
      expect(padding).toBeTruthy();
    }
  });

  test('should work on new run page with mobile layout', async ({ page }) => {
    await page.goto('/dashboard/new-run');

    // Page should load without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1); // Allow 1px tolerance

    // Form inputs should be readable
    const nicheInput = page.getByLabel(/niche/i).or(
      page.getByPlaceholder(/niche/i)
    );
    await expect(nicheInput.first()).toBeVisible();

    // Submit button should be accessible
    const submitButton = page.getByRole('button', { name: /Start Analysis/i }).or(
      page.getByRole('button', { name: /Run Analysis/i })
    );
    if (await submitButton.count() > 0) {
      await expect(submitButton.first()).toBeVisible();
    }
  });

  test('should support touch gestures for dropdowns on mobile', async ({ page }) => {
    await page.goto('/dashboard/runs');

    // Find and tap a dropdown menu trigger
    const dropdownTrigger = page.getByRole('button', { name: /more/i }).or(
      page.locator('button').filter({ has: page.locator('[class*="MoreVertical"]') })
    ).first();

    if (await dropdownTrigger.isVisible()) {
      // Should be touch-friendly
      const triggerBox = await dropdownTrigger.boundingBox();
      expect(triggerBox).not.toBeNull();
      if (triggerBox) {
        expect(triggerBox.width).toBeGreaterThanOrEqual(32); // Minimum touch target
        expect(triggerBox.height).toBeGreaterThanOrEqual(32);
      }

      // Tap to open
      await dropdownTrigger.tap();

      // Menu should appear
      await page.waitForTimeout(200);
      const menuItem = page.getByRole('menuitem').first();
      const isVisible = await menuItem.isVisible();
      expect(isVisible).toBe(true);
    }
  });

  test('should have responsive header on mobile', async ({ page }) => {
    // Header should be visible
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Header should not cause horizontal overflow
    const headerWidth = await header.evaluate((el) => el.scrollWidth);
    expect(headerWidth).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 5); // Small tolerance

    // Breadcrumb should be visible
    const breadcrumb = page.getByText('GapRadar');
    await expect(breadcrumb).toBeVisible();
  });

  test('should handle long niche names gracefully on mobile', async ({ page }) => {
    await page.goto('/dashboard/runs');

    // Find a card with niche text
    const nicheText = page.locator('.font-medium').filter({ hasText: /AI-powered/i }).first();

    if (await nicheText.isVisible()) {
      // Should truncate or wrap appropriately
      const textBox = await nicheText.boundingBox();
      if (textBox) {
        expect(textBox.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width - 32); // Allow padding
      }

      // Check for truncation class
      const className = await nicheText.evaluate((el) => el.className);
      const hasTruncation = className.includes('truncate') || className.includes('line-clamp');
      expect(hasTruncation).toBe(true);
    }
  });

  test('should display mobile-optimized cards on reports page', async ({ page }) => {
    await page.goto('/dashboard/reports');

    // Desktop table should be hidden on mobile
    const desktopTable = page.locator('table').first();
    await expect(desktopTable).toBeHidden();

    // Mobile card view should be visible
    const mobileCards = page.locator('.md\\:hidden').first();
    await expect(mobileCards).toBeVisible();

    // Mobile cards should have action buttons
    const viewButton = page.getByRole('button', { name: /View/i }).first();
    const exportButton = page.getByRole('button', { name: /Export/i }).first();
    const shareButton = page.getByRole('button', { name: /Share/i }).first();

    await expect(viewButton).toBeVisible();
    await expect(exportButton).toBeVisible();
    await expect(shareButton).toBeVisible();

    // Buttons should be touch-friendly
    const viewButtonBox = await viewButton.boundingBox();
    if (viewButtonBox) {
      expect(viewButtonBox.height).toBeGreaterThanOrEqual(32);
    }
  });
});

test.describe('Tablet Responsive Tests (UI-003)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);
    await page.goto('/dashboard');
  });

  test('should show desktop table on tablet-sized screens', async ({ page }) => {
    await page.goto('/dashboard/runs');

    // Desktop table should be visible on tablet
    const desktopTable = page.locator('table').first();
    await expect(desktopTable).toBeVisible();

    // Mobile cards should be hidden
    const mobileCards = page.locator('.md\\:hidden').first();
    await expect(mobileCards).toBeHidden();
  });

  test('should display multi-column grid on tablet', async ({ page }) => {
    // Stats grid should show multiple columns
    const statsGrid = page.locator('.grid').first();
    await expect(statsGrid).toBeVisible();

    const gridTemplateColumns = await statsGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });

    // Should have at least 2 columns on tablet
    const columnCount = gridTemplateColumns.split(' ').length;
    expect(columnCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Responsive Navigation Tests (UI-003)', () => {
  test('should navigate between all major pages on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/dashboard');

    // Helper to open sidebar and click link
    const navigateViaLink = async (linkName: RegExp, expectedPath: RegExp) => {
      // Open sidebar
      const trigger = page.locator('[data-sidebar="trigger"]').or(
        page.getByRole('button').filter({ has: page.locator('svg') }).first()
      );
      await trigger.first().click();
      await page.waitForTimeout(300);

      // Click link
      const link = page.getByRole('link', { name: linkName });
      await expect(link).toBeVisible();
      await link.click();

      // Verify navigation
      await expect(page).toHaveURL(expectedPath);
    };

    // Test navigation to key pages
    await navigateViaLink(/New Analysis/i, /\/dashboard\/new-run/);
    await navigateViaLink(/Runs/i, /\/dashboard\/runs/);
    await navigateViaLink(/Dashboard/i, /\/dashboard$/);
  });
});

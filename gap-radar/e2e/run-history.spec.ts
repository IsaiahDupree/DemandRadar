import { test, expect } from '@playwright/test';

/**
 * Run History Page E2E Tests (DASH-007)
 *
 * Tests the run history page with pagination, status display, and actions.
 */

test.describe('Run History Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to runs page
    await page.goto('/dashboard/runs');

    // Skip tests if redirected to login (not authenticated)
    const url = page.url();
    if (url.includes('/login') || url.includes('/signup')) {
      test.skip();
    }
  });

  test('should display run history page with header', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: /analysis runs/i })).toBeVisible();

    // Check description text
    await expect(page.getByText(/view and manage your market analysis runs/i)).toBeVisible();

    // Check "New Analysis" button
    await expect(page.getByRole('link', { name: /new analysis/i })).toBeVisible();
  });

  test('should display runs with status badges', async ({ page }) => {
    // Wait for table to load
    const table = page.locator('table').or(page.locator('[role="table"]'));

    // Check if we're on desktop (table view) or mobile (card view)
    const isDesktop = await page.locator('table').isVisible().catch(() => false);

    if (isDesktop) {
      // Desktop view - check table headers
      await expect(page.getByRole('columnheader', { name: /niche query/i })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();

      // Check for status badges
      const statusBadges = page.getByText(/complete|running|failed|queued/i);
      await expect(statusBadges.first()).toBeVisible();
    } else {
      // Mobile view - check card view
      const cards = page.locator('[class*="border"][class*="rounded"]');
      await expect(cards.first()).toBeVisible();
    }
  });

  test('should allow clicking run to view details', async ({ page }) => {
    // Find the first "View Details" button/link
    const viewDetailsButton = page.getByRole('button', { name: /more/i }).or(
      page.locator('[aria-haspopup="menu"]')
    ).first();

    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();

      // Click "View Details" from dropdown
      const viewDetails = page.getByRole('menuitem', { name: /view details/i });
      await expect(viewDetails).toBeVisible();

      await viewDetails.click();

      // Should navigate to run detail page
      await expect(page).toHaveURL(/\/dashboard\/runs\/[a-f0-9-]+/);
    }
  });

  test('should display delete action in dropdown menu', async ({ page }) => {
    // Find the first action menu button
    const menuButton = page.getByRole('button', { name: /more/i }).or(
      page.locator('[aria-haspopup="menu"]')
    ).first();

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Check for delete option
      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      await expect(deleteOption).toBeVisible();
    }
  });

  test('should implement pagination for large run lists', async ({ page }) => {
    // Check if pagination controls are present
    // Look for the pagination navigation element
    const paginationNav = page.locator('nav[aria-label="pagination"]');

    // Should have pagination navigation visible
    await expect(paginationNav).toBeVisible();

    // Check for Previous and Next buttons
    const previousLink = page.getByRole('link', { name: /previous/i });
    const nextLink = page.getByRole('link', { name: /next/i });

    await expect(previousLink).toBeVisible();
    await expect(nextLink).toBeVisible();

    // Check for page number links
    const pageOneLink = page.getByRole('link', { name: '1' });
    await expect(pageOneLink).toBeVisible();
  });

  test('should show correct run count in header', async ({ page }) => {
    // Check for run count display (e.g., "12 total runs • 8 completed")
    const runCountText = page.getByText(/\d+\s+total runs/i);
    await expect(runCountText).toBeVisible();
  });

  test('should display duration for completed runs', async ({ page }) => {
    // Look for duration format (e.g., "2m 30s")
    const durationPattern = /\d+m\s+\d+s/;

    // Check if desktop table is visible
    const isDesktop = await page.locator('table').isVisible().catch(() => false);

    if (isDesktop) {
      // Desktop: check for duration column
      const durationCell = page.locator('td', { hasText: durationPattern }).or(
        page.getByText(durationPattern)
      );

      // Should have at least one duration displayed
      const count = await durationCell.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should display opportunity and confidence scores for completed runs', async ({ page }) => {
    // Look for progress bars and percentage values
    const progressBars = page.locator('[role="progressbar"]').or(
      page.locator('progress')
    );

    const percentagePattern = /\d+%/;
    const percentageText = page.getByText(percentagePattern);

    // Should have at least one progress bar or percentage
    const hasScores =
      await progressBars.first().isVisible().catch(() => false) ||
      await percentageText.first().isVisible().catch(() => false);

    expect(hasScores).toBe(true);
  });
});

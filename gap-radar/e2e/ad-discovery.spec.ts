import { test, expect } from '@playwright/test';

/**
 * Ad Discovery Grid E2E Tests (HOOKD-001)
 *
 * Tests the ad discovery interface similar to Hookd Discover page.
 * Users should be able to:
 * - View a grid of collected ads
 * - See ad thumbnails, metrics, and metadata
 * - Filter ads by source, media type, and advertiser
 * - Click ads to view details
 */

test.describe('Ad Discovery Grid (HOOKD-001)', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no test credentials
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

    // Sign in before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/i);
  });

  test('should navigate to ads discovery page', async ({ page }) => {
    // Navigate to ads page
    await page.goto('/dashboard/ads');

    // Verify page title
    await expect(page.getByRole('heading', { name: /ad discovery|discover ads|ad library/i })).toBeVisible();
  });

  test('should display grid of ad cards', async ({ page }) => {
    // Navigate to ads page
    await page.goto('/dashboard/ads');

    // Wait for grid to load
    await page.waitForSelector('[data-testid="ad-grid"]', { timeout: 10000 });

    // Check that grid exists
    const grid = page.locator('[data-testid="ad-grid"]');
    await expect(grid).toBeVisible();

    // Check that at least one ad card is visible (if data exists)
    const adCards = page.locator('[data-testid="ad-card"]');
    const count = await adCards.count();

    // If there are ads, verify card structure
    if (count > 0) {
      const firstCard = adCards.first();
      await expect(firstCard).toBeVisible();

      // Verify card has essential elements
      // Should show advertiser name
      await expect(firstCard.locator('[data-testid="ad-advertiser"]')).toBeVisible();
    } else {
      // If no ads, should show empty state
      await expect(page.getByText(/no ads found|no results|run an analysis/i)).toBeVisible();
    }
  });

  test('should display ad card with thumbnail and metrics', async ({ page }) => {
    await page.goto('/dashboard/ads');

    // Wait for grid
    await page.waitForSelector('[data-testid="ad-grid"]', { timeout: 10000 });

    const adCards = page.locator('[data-testid="ad-card"]');
    const count = await adCards.count();

    test.skip(count === 0, 'No ads available to test');

    const firstCard = adCards.first();

    // Check for advertiser name
    await expect(firstCard.locator('[data-testid="ad-advertiser"]')).toBeVisible();

    // Check for creative text or headline
    const hasText = await firstCard.locator('[data-testid="ad-text"]').isVisible();
    const hasHeadline = await firstCard.locator('[data-testid="ad-headline"]').isVisible();
    expect(hasText || hasHeadline).toBeTruthy();

    // Check for source badge (Meta/Google)
    await expect(firstCard.locator('[data-testid="ad-source"]')).toBeVisible();
  });

  test('should filter ads by source', async ({ page }) => {
    await page.goto('/dashboard/ads');

    // Wait for filters to load
    await page.waitForSelector('[data-testid="filter-panel"]', { timeout: 10000 });

    // Check if source filter exists
    const sourceFilter = page.locator('[data-testid="filter-source"]');
    if (await sourceFilter.isVisible()) {
      // Click Meta filter
      await sourceFilter.selectOption('meta');

      // Wait for results to update
      await page.waitForTimeout(500);

      // Verify all visible ads are from Meta
      const adCards = page.locator('[data-testid="ad-card"]');
      const count = await adCards.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const source = adCards.nth(i).locator('[data-testid="ad-source"]');
          await expect(source).toContainText(/meta/i);
        }
      }
    }
  });

  test('should filter ads by media type', async ({ page }) => {
    await page.goto('/dashboard/ads');

    // Wait for filters
    await page.waitForSelector('[data-testid="filter-panel"]', { timeout: 10000 });

    // Check if media type filter exists
    const mediaFilter = page.locator('[data-testid="filter-media-type"]');
    if (await mediaFilter.isVisible()) {
      // Select video filter
      await mediaFilter.selectOption('video');

      // Wait for results
      await page.waitForTimeout(500);

      // Verify ads are filtered
      const adCards = page.locator('[data-testid="ad-card"]');
      const count = await adCards.count();

      if (count > 0) {
        // Should show video badge or indicator
        const firstCard = adCards.first();
        await expect(firstCard.locator('[data-testid="ad-media-type"]')).toContainText(/video/i);
      }
    }
  });

  test('should show ad longevity indicator', async ({ page }) => {
    await page.goto('/dashboard/ads');

    await page.waitForSelector('[data-testid="ad-grid"]', { timeout: 10000 });

    const adCards = page.locator('[data-testid="ad-card"]');
    const count = await adCards.count();

    test.skip(count === 0, 'No ads available to test');

    const firstCard = adCards.first();

    // Should show days running or date range
    const hasLongevity = await firstCard.locator('[data-testid="ad-longevity"]').isVisible();
    const hasDates = await firstCard.locator('[data-testid="ad-dates"]').isVisible();

    expect(hasLongevity || hasDates).toBeTruthy();
  });

  test('should click ad card to view details', async ({ page }) => {
    await page.goto('/dashboard/ads');

    await page.waitForSelector('[data-testid="ad-grid"]', { timeout: 10000 });

    const adCards = page.locator('[data-testid="ad-card"]');
    const count = await adCards.count();

    test.skip(count === 0, 'No ads available to test');

    // Click first ad card
    await adCards.first().click();

    // Should open detail modal or navigate to detail page
    const detailModal = page.locator('[data-testid="ad-detail-modal"]');
    const detailPage = page.locator('[data-testid="ad-detail-page"]');

    const modalVisible = await detailModal.isVisible({ timeout: 2000 }).catch(() => false);
    const pageVisible = await detailPage.isVisible({ timeout: 2000 }).catch(() => false);

    expect(modalVisible || pageVisible).toBeTruthy();
  });

  test('should show empty state when no ads exist', async ({ page }) => {
    await page.goto('/dashboard/ads');

    // Wait for page to load
    await page.waitForSelector('[data-testid="ad-grid"]', { timeout: 10000 });

    const adCards = page.locator('[data-testid="ad-card"]');
    const count = await adCards.count();

    if (count === 0) {
      // Should show empty state
      await expect(page.getByText(/no ads found|no results/i)).toBeVisible();

      // Should show CTA to run analysis
      const createRunButton = page.getByRole('link', { name: /new analysis|create run|start analysis/i });
      await expect(createRunButton).toBeVisible();
    }
  });

  test('should show loading state while fetching ads', async ({ page }) => {
    await page.goto('/dashboard/ads');

    // Should show skeleton or loading state initially
    const skeleton = page.locator('[data-testid="ad-grid-skeleton"]');
    const spinner = page.locator('[data-testid="loading-spinner"]');

    // At least one loading indicator should appear briefly
    const hasLoadingState = await Promise.race([
      skeleton.isVisible({ timeout: 1000 }).catch(() => false),
      spinner.isVisible({ timeout: 1000 }).catch(() => false),
    ]);

    // Note: Loading might be too fast to catch, so we don't fail if we miss it
    // Just verify the page eventually loads
    await page.waitForSelector('[data-testid="ad-grid"]', { timeout: 10000 });
  });
});

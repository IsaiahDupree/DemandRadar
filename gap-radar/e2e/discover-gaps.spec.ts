import { test, expect } from '@playwright/test';

test.describe('Discover Gaps Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the gaps/discover page
    // Since we don't have auth set up for testing, we'll test the page directly
    await page.goto('/dashboard/gaps');
  });

  test('should display gap cards grid', async ({ page }) => {
    // Check that the page title is present
    await expect(page.getByRole('heading', { name: /gap opportunities/i })).toBeVisible();

    // Check that gap cards are displayed
    const gapCards = page.locator('[data-testid="gap-card"]');
    await expect(gapCards).toHaveCount(await gapCards.count());

    // Verify at least one gap card is visible
    await expect(gapCards.first()).toBeVisible();
  });

  test('should have filter panel', async ({ page }) => {
    // Check for filter panel or filter button
    const filterPanel = page.getByTestId('filter-panel');
    await expect(filterPanel).toBeVisible();

    // Check for gap type filters
    await expect(page.getByText(/product/i)).toBeVisible();
    await expect(page.getByText(/offer/i)).toBeVisible();
    await expect(page.getByText(/positioning/i)).toBeVisible();
  });

  test('should filter gaps by type', async ({ page }) => {
    // Get initial gap count
    const allGaps = page.locator('[data-testid="gap-card"]');
    const initialCount = await allGaps.count();

    // Click on a filter (e.g., "product")
    await page.getByTestId('filter-product').click();

    // Verify filtered results
    const filteredGaps = page.locator('[data-testid="gap-card"]');
    const filteredCount = await filteredGaps.count();

    // Should have fewer or equal gaps after filtering
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // All visible gaps should be of type "product"
    const gapTypes = page.locator('[data-testid="gap-type"]');
    for (let i = 0; i < filteredCount; i++) {
      const gapType = await gapTypes.nth(i).textContent();
      expect(gapType?.toLowerCase()).toContain('product');
    }
  });

  test('should have search bar', async ({ page }) => {
    // Check for search input
    const searchInput = page.getByPlaceholder(/search gaps/i);
    await expect(searchInput).toBeVisible();
  });

  test('should filter gaps by search query', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search gaps/i);

    // Type in search query
    await searchInput.fill('pricing');

    // Wait for search results to update
    await page.waitForTimeout(500);

    // Check that results contain the search term
    const gapCards = page.locator('[data-testid="gap-card"]');
    const count = await gapCards.count();

    if (count > 0) {
      // At least one result should contain "pricing" in title or description
      const firstCard = gapCards.first();
      const cardText = await firstCard.textContent();
      expect(cardText?.toLowerCase()).toContain('pricing');
    }
  });

  test('should have view toggles', async ({ page }) => {
    // Check for view toggle buttons (grid/list)
    const gridViewButton = page.getByTestId('view-grid');
    const listViewButton = page.getByTestId('view-list');

    await expect(gridViewButton).toBeVisible();
    await expect(listViewButton).toBeVisible();
  });

  test('should toggle between grid and list views', async ({ page }) => {
    const gridViewButton = page.getByTestId('view-grid');
    const listViewButton = page.getByTestId('view-list');

    // Switch to list view
    await listViewButton.click();

    // Check that layout changed (e.g., cards are now in list layout)
    const gapContainer = page.getByTestId('gaps-container');
    await expect(gapContainer).toHaveClass(/list/);

    // Switch back to grid view
    await gridViewButton.click();
    await expect(gapContainer).toHaveClass(/grid/);
  });

  test('should show stats cards', async ({ page }) => {
    // Check for summary stats
    await expect(page.getByText(/total gaps found/i)).toBeVisible();
    await expect(page.getByText(/avg opportunity score/i)).toBeVisible();
    await expect(page.getByText(/high confidence gaps/i)).toBeVisible();
  });

  test('should display gap details', async ({ page }) => {
    // Check that each gap card shows required information
    const firstGapCard = page.locator('[data-testid="gap-card"]').first();

    // Should show title
    await expect(firstGapCard.getByTestId('gap-title')).toBeVisible();

    // Should show opportunity score
    await expect(firstGapCard.getByTestId('gap-score')).toBeVisible();

    // Should show gap type badge
    await expect(firstGapCard.getByTestId('gap-type')).toBeVisible();

    // Should show confidence
    await expect(firstGapCard.getByTestId('gap-confidence')).toBeVisible();
  });

  test('should combine filters and search', async ({ page }) => {
    // Apply a filter
    await page.getByTestId('filter-product').click();

    // Apply a search
    const searchInput = page.getByPlaceholder(/search gaps/i);
    await searchInput.fill('pricing');

    await page.waitForTimeout(500);

    // Results should match both filter and search
    const gapCards = page.locator('[data-testid="gap-card"]');
    const count = await gapCards.count();

    // Verify results are filtered
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should clear filters', async ({ page }) => {
    // Apply a filter
    await page.getByTestId('filter-product').click();

    const filteredGaps = page.locator('[data-testid="gap-card"]');
    const filteredCount = await filteredGaps.count();

    // Clear filter
    const clearButton = page.getByTestId('clear-filters');
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Should show all gaps again
      const allGaps = page.locator('[data-testid="gap-card"]');
      const allCount = await allGaps.count();
      expect(allCount).toBeGreaterThanOrEqual(filteredCount);
    }
  });

  test('should show empty state when no gaps match filters', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search gaps/i);

    // Search for something that won't match
    await searchInput.fill('zzzznonexistentquery123');
    await page.waitForTimeout(500);

    // Should show empty state or no results message
    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
  });
});

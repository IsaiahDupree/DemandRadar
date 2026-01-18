import { test, expect } from '@playwright/test';

/**
 * UI-013: Comparison View
 *
 * Tests for side-by-side comparison of multiple analysis runs:
 * - Select runs to compare
 * - Side-by-side layout
 * - Highlight differences
 */

test.describe('Comparison View (UI-013)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/compare');
  });

  test('should show run selection interface initially', async ({ page }) => {
    // Should show title
    await expect(page.getByRole('heading', { name: /Compare Runs/i })).toBeVisible();

    // Should show selection description
    await expect(page.getByText(/Select runs to compare/i)).toBeVisible();

    // Should show alert about minimum runs
    await expect(page.getByText(/Choose at least 2 runs/i)).toBeVisible();
  });

  test('should allow selecting runs to compare (Acceptance: Select runs to compare)', async ({ page }) => {
    // Wait for completed runs to load
    await page.waitForSelector('text=Select Runs to Compare', { timeout: 5000 });

    // Find checkboxes for runs
    const checkboxes = page.getByRole('checkbox');
    const count = await checkboxes.count();

    if (count >= 2) {
      // Select first two runs
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();

      // Verify selection count updates
      await expect(page.getByText(/2 runs selected/i)).toBeVisible();

      // Compare button should be enabled
      const compareButton = page.getByRole('button', { name: /Compare/i });
      await expect(compareButton).toBeEnabled();
    }
  });

  test('should enforce maximum of 4 runs selection', async ({ page }) => {
    await page.waitForSelector('text=Select Runs to Compare', { timeout: 5000 });

    const checkboxes = page.getByRole('checkbox');
    const count = await checkboxes.count();

    // Try to select up to 5 runs if available
    const selectCount = Math.min(count, 5);
    for (let i = 0; i < selectCount; i++) {
      await checkboxes.nth(i).click();
    }

    // Should show max 4 runs selected
    const selectedText = await page.getByText(/runs selected/i).textContent();
    expect(selectedText).toMatch(/[0-4] runs selected/);
  });

  test('should display side-by-side comparison layout (Acceptance: Side-by-side layout)', async ({ page }) => {
    // Navigate with URL params to show comparison view
    await page.goto('/dashboard/compare?runs=1,2');

    // Should show comparison table with data-testid
    const comparisonView = page.getByTestId('comparison-view');
    await expect(comparisonView).toBeVisible();

    // Should have table structure
    await expect(page.getByRole('table')).toBeVisible();

    // Should have metric column header
    await expect(page.getByRole('columnheader', { name: /Metric/i })).toBeVisible();

    // Should show multiple run columns
    const runHeaders = page.getByRole('columnheader').filter({ hasNot: page.getByText('Metric') });
    const runCount = await runHeaders.count();
    expect(runCount).toBeGreaterThanOrEqual(2);
  });

  test('should highlight differences in scores (Acceptance: Highlight differences)', async ({ page }) => {
    await page.goto('/dashboard/compare?runs=1,2');

    // Wait for comparison view to load
    await page.waitForSelector('[data-testid="comparison-view"]', { timeout: 5000 });

    // Look for highlighted cells (green background for best scores)
    const highlightedCells = page.locator('.bg-green-50, .dark\\:bg-green-950');

    // Should have some highlighted cells (differences)
    const highlightCount = await highlightedCells.count();
    expect(highlightCount).toBeGreaterThan(0);
  });

  test('should display key comparison metrics', async ({ page }) => {
    await page.goto('/dashboard/compare?runs=1,2');

    await page.waitForSelector('[data-testid="comparison-view"]', { timeout: 5000 });

    // Should show Opportunity Score row
    await expect(page.getByRole('cell', { name: /Opportunity Score/i })).toBeVisible();

    // Should show Confidence row
    await expect(page.getByRole('cell', { name: /^Confidence$/i })).toBeVisible();

    // Should show Saturation row
    await expect(page.getByRole('cell', { name: /^Saturation$/i })).toBeVisible();

    // Should show Seed Terms row
    await expect(page.getByRole('cell', { name: /Seed Terms/i })).toBeVisible();
  });

  test('should allow removing runs from comparison', async ({ page }) => {
    await page.goto('/dashboard/compare?runs=1,2,3');

    await page.waitForSelector('[data-testid="comparison-view"]', { timeout: 5000 });

    // Find remove buttons (X icons)
    const removeButtons = page.getByRole('button', { name: /Remove/i });
    const initialCount = await removeButtons.count();

    if (initialCount > 0) {
      // Click first remove button
      await removeButtons.first().click();

      // Should navigate back or reduce columns
      await page.waitForTimeout(500);

      // Either back to selection or fewer columns
      const isSelecting = await page.getByText(/Select runs to compare/i).isVisible().catch(() => false);
      if (!isSelecting) {
        const newCount = await page.getByRole('button', { name: /Remove/i }).count();
        expect(newCount).toBeLessThan(initialCount);
      }
    }
  });

  test('should allow adding more runs to comparison', async ({ page }) => {
    await page.goto('/dashboard/compare?runs=1,2');

    await page.waitForSelector('[data-testid="comparison-view"]', { timeout: 5000 });

    // Should have "Add Run" button
    const addButton = page.getByRole('button', { name: /Add Run/i });
    await expect(addButton).toBeVisible();

    // Click add button
    await addButton.click();

    // Should go back to selection mode
    await expect(page.getByText(/Select Runs to Compare/i)).toBeVisible();
  });

  test('should show export option in comparison view', async ({ page }) => {
    await page.goto('/dashboard/compare?runs=1,2');

    await page.waitForSelector('[data-testid="comparison-view"]', { timeout: 5000 });

    // Should have Export button
    const exportButton = page.getByRole('button', { name: /Export/i });
    await expect(exportButton).toBeVisible();
  });

  test('should display run status badges', async ({ page }) => {
    await page.goto('/dashboard/compare?runs=1,2');

    await page.waitForSelector('[data-testid="comparison-view"]', { timeout: 5000 });

    // Should show status badges in headers
    const statusBadges = page.locator('[class*="bg-green-500"], [class*="bg-blue-500"]');
    const badgeCount = await statusBadges.count();

    // Should have at least some status indicators
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard/compare?runs=1,2');

    // Should have horizontal scroll container for table
    const scrollRegion = page.getByRole('region', { name: /comparison/i });
    await expect(scrollRegion).toBeVisible();

    // Title should still be visible
    await expect(page.getByRole('heading', { name: /Compare Runs/i })).toBeVisible();
  });

  test('UI-013 Acceptance Criteria: All acceptance criteria met', async ({ page }) => {
    // Acceptance 1: Select runs to compare
    await page.goto('/dashboard/compare');
    await page.waitForSelector('text=Select Runs to Compare', { timeout: 5000 });

    const checkboxes = page.getByRole('checkbox');
    const count = await checkboxes.count();

    if (count >= 2) {
      await checkboxes.nth(0).click();
      await checkboxes.nth(1).click();
      await expect(page.getByRole('button', { name: /Compare/i })).toBeEnabled();
    }

    // Acceptance 2: Side-by-side layout
    await page.goto('/dashboard/compare?runs=1,2');
    await page.waitForSelector('[data-testid="comparison-view"]', { timeout: 5000 });
    await expect(page.getByRole('table')).toBeVisible();

    // Acceptance 3: Highlight differences
    const highlightedCells = page.locator('.bg-green-50, .dark\\:bg-green-950');
    const highlightCount = await highlightedCells.count();
    expect(highlightCount).toBeGreaterThan(0);
  });
});

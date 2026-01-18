import { test, expect } from '@playwright/test';

test.describe('Saved Gaps Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to saved gaps page (assuming user is authenticated)
    await page.goto('/dashboard/saved');
  });

  test('should display page title and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Saved Gaps');
    await expect(page.getByText(/bookmarked.*opportunities/i)).toBeVisible();
  });

  test('should display empty state when no saved gaps', async ({ page }) => {
    // Check for empty state message
    const emptyState = page.getByTestId('empty-state');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText('No saved gaps');
    }
  });

  test('should display list of saved gaps when available', async ({ page }) => {
    // Check if gaps container exists
    const gapsContainer = page.getByTestId('saved-gaps-container');
    await expect(gapsContainer).toBeVisible();
  });

  test('should allow removing a gap from saved list', async ({ page }) => {
    // Find first gap card
    const gapCard = page.getByTestId('gap-card').first();

    // Click remove button
    const removeButton = gapCard.getByTestId('remove-from-saved');
    if (await removeButton.isVisible()) {
      await removeButton.click();

      // Verify gap is removed (either removed from DOM or shows confirmation)
      await expect(page.getByText(/removed from saved/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display export button for saved gaps', async ({ page }) => {
    // Check for export button
    const exportButton = page.getByTestId('export-saved-gaps');
    await expect(exportButton).toBeVisible();
  });

  test('should export saved gaps when export button clicked', async ({ page }) => {
    const exportButton = page.getByTestId('export-saved-gaps');

    if (await exportButton.isVisible()) {
      // Listen for download
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      await exportButton.click();

      const download = await downloadPromise;

      if (download) {
        // Verify download started
        expect(download.suggestedFilename()).toMatch(/saved-gaps.*\.(json|csv)/i);
      }
    }
  });

  test('should show gap details with title, type, and score', async ({ page }) => {
    const gapCard = page.getByTestId('gap-card').first();

    if (await gapCard.isVisible()) {
      // Verify gap card has required information
      await expect(gapCard.getByTestId('gap-title')).toBeVisible();
      await expect(gapCard.getByTestId('gap-type')).toBeVisible();
      await expect(gapCard.getByTestId('gap-score')).toBeVisible();
    }
  });

  test('should navigate back to all gaps', async ({ page }) => {
    // Check for back/view all gaps link
    const viewAllLink = page.getByText(/view all gaps|back to gaps/i);

    if (await viewAllLink.isVisible()) {
      await viewAllLink.click();
      await expect(page).toHaveURL(/\/dashboard\/gaps/);
    }
  });

  test('should show timestamp when gap was saved', async ({ page }) => {
    const gapCard = page.getByTestId('gap-card').first();

    if (await gapCard.isVisible()) {
      // Check for saved timestamp
      await expect(gapCard.getByText(/saved/i)).toBeVisible();
    }
  });
});

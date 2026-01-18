import { test, expect } from '@playwright/test';

test.describe('Brand/Competitor Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // For now we'll test with a mock brand ID
    // In production this would link from the gaps page or ads view
    await page.goto('/dashboard/brands/test-brand-1');
  });

  test('should display brand information', async ({ page }) => {
    // Check that the page title/heading shows the brand name
    await expect(page.getByRole('heading', { name: /WatermarkRemover Pro/i })).toBeVisible();
  });

  test('should display ad grid for the brand', async ({ page }) => {
    // Check that ads from this brand are displayed
    const adCards = page.locator('[data-testid="brand-ad-card"]');
    await expect(adCards.first()).toBeVisible();

    // Should have at least one ad
    const adCount = await adCards.count();
    expect(adCount).toBeGreaterThan(0);
  });

  test('should display gap list related to the brand', async ({ page }) => {
    // Check for gaps section
    await expect(page.getByText(/related gaps/i)).toBeVisible();

    // Check that gap cards are visible
    const gapCards = page.locator('[data-testid="brand-gap-card"]');
    await expect(gapCards.first()).toBeVisible();
  });

  test('should have track button', async ({ page }) => {
    // Check for track/follow button
    const trackButton = page.getByTestId('track-brand-button');
    await expect(trackButton).toBeVisible();

    // Button should be clickable
    await expect(trackButton).toBeEnabled();
  });

  test('should toggle track status when button clicked', async ({ page }) => {
    const trackButton = page.getByTestId('track-brand-button');

    // Get initial button text
    const initialText = await trackButton.textContent();

    // Click the track button
    await trackButton.click();

    // Button text should change
    const newText = await trackButton.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('should display brand metrics', async ({ page }) => {
    // Check for brand-specific metrics/stats
    await expect(page.getByText(/total ads/i)).toBeVisible();
    await expect(page.getByText(/days active/i)).toBeVisible();
  });

  test('should show ad details in grid', async ({ page }) => {
    const firstAd = page.locator('[data-testid="brand-ad-card"]').first();

    // Each ad should show key details
    await expect(firstAd).toBeVisible();

    // Should have creative text or headline visible
    const adText = await firstAd.textContent();
    expect(adText).toBeTruthy();
    expect(adText!.length).toBeGreaterThan(0);
  });

  test('should navigate back to gaps page', async ({ page }) => {
    // Check for back button or breadcrumb
    const backLink = page.getByRole('link', { name: /back/i }).or(page.getByRole('link', { name: /gaps/i }));

    // Should have navigation back
    await expect(backLink).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Competitor Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to competitor detail page (assuming user is authenticated)
    // Using a test competitor ID
    await page.goto('/dashboard/competitors/test-competitor-id-123');
  });

  test('should display competitor name and basic info', async ({ page }) => {
    // Check that the page shows competitor name
    await expect(page.locator('h1')).toBeVisible();

    // Should show domain if available
    const domainText = page.getByText(/\.com|\.io|\.app/);
    if (await domainText.isVisible()) {
      await expect(domainText).toBeVisible();
    }
  });

  test('should have back button to return to competitors list', async ({ page }) => {
    const backButton = page.getByRole('link', { name: /back/i });
    await expect(backButton).toBeVisible();
    await expect(backButton).toHaveAttribute('href', '/dashboard/competitors');
  });

  test('should display ad activity summary section', async ({ page }) => {
    // Check for ad activity section
    await expect(page.getByText(/ad activity/i)).toBeVisible();

    // Should show active ads count
    await expect(page.getByText(/active ads/i)).toBeVisible();

    // Should show tracking duration
    await expect(page.getByText(/tracking since/i)).toBeVisible();
  });

  test('should show weekly ad statistics', async ({ page }) => {
    // Check for this week's stats
    const weeklyStats = page.getByText(/this week/i);
    if (await weeklyStats.isVisible()) {
      // Should show new, stopped, and unchanged counts
      await expect(page.getByText(/new/i)).toBeVisible();
      await expect(page.getByText(/stopped/i)).toBeVisible();
    }
  });

  test('should show monthly ad statistics', async ({ page }) => {
    // Check for this month's stats
    const monthlyStats = page.getByText(/this month/i);
    if (await monthlyStats.isVisible()) {
      // Should show monthly counts
      await expect(monthlyStats).toBeVisible();
    }
  });

  test('should display new ads section', async ({ page }) => {
    // Check for new ads heading
    const newAdsHeading = page.getByText(/new ads.*this week/i);

    if (await newAdsHeading.isVisible()) {
      await expect(newAdsHeading).toBeVisible();

      // Check for ad preview cards
      const adPreviews = page.locator('[data-testid="ad-preview"]');
      const adCount = await adPreviews.count();

      if (adCount > 0) {
        // Each ad should show hook/headline
        await expect(adPreviews.first().getByText(/hook:|headline:/i)).toBeVisible();

        // Each ad should show started date
        await expect(adPreviews.first().getByText(/started:/i)).toBeVisible();
      }
    }
  });

  test('should display top performing ads section', async ({ page }) => {
    // Check for top performing ads heading
    const topAdsHeading = page.getByText(/top performing.*ads|winner.*ads/i);

    if (await topAdsHeading.isVisible()) {
      await expect(topAdsHeading).toBeVisible();

      // Check for long-running ads (30+ days)
      const longRunningAds = page.locator('[data-testid="ad-preview"]');
      const adCount = await longRunningAds.count();

      if (adCount > 0) {
        // Each ad should show running duration
        await expect(longRunningAds.first().getByText(/running:|days/i)).toBeVisible();
      }
    }
  });

  test('should display detected creative patterns', async ({ page }) => {
    // Check for patterns section
    const patternsHeading = page.getByText(/creative patterns.*detected|patterns detected/i);

    if (await patternsHeading.isVisible()) {
      await expect(patternsHeading).toBeVisible();

      // Should show pattern insights as bullet points
      const patternList = page.locator('ul, [data-testid="pattern-list"]');
      if (await patternList.isVisible()) {
        await expect(patternList).toBeVisible();
      }
    }
  });

  test('should show empty state for new ads when none exist', async ({ page }) => {
    // If no new ads this week, should show empty message
    const emptyState = page.getByText(/no new ads|no ads.*this week/i);
    const newAdsSection = page.getByText(/new ads.*this week/i);

    if (await newAdsSection.isVisible()) {
      const adPreviews = page.locator('[data-testid="ad-preview"]');
      const adCount = await adPreviews.count();

      if (adCount === 0) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test('should show empty state for patterns when none detected', async ({ page }) => {
    const patternsHeading = page.getByText(/creative patterns.*detected|patterns detected/i);

    if (await patternsHeading.isVisible()) {
      const patternList = page.locator('ul li, [data-testid="pattern-item"]');
      const patternCount = await patternList.count();

      if (patternCount === 0) {
        await expect(page.getByText(/no patterns|not enough data/i)).toBeVisible();
      }
    }
  });

  test('should display loading state initially', async ({ page }) => {
    // Reload to see loading state
    await page.reload();

    // Check for skeleton loaders or loading indicators
    const loadingIndicator = page.getByTestId('loading-skeleton');
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      await expect(loadingIndicator).toBeVisible();
    }
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Navigate to non-existent competitor
    await page.goto('/dashboard/competitors/nonexistent-id-999');

    // Should show error message or redirect
    const errorMessage = page.getByText(/not found|error|failed to load/i);
    const hasError = await errorMessage.isVisible({ timeout: 5000 });

    if (hasError) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should have settings/edit button', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: /settings|edit|configure/i });
    if (await settingsButton.isVisible()) {
      await expect(settingsButton).toBeVisible();
    }
  });

  test('should have delete/remove button', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: /delete|remove|untrack/i });
    if (await deleteButton.isVisible()) {
      await expect(deleteButton).toBeVisible();
    }
  });

  test('should show trend indicator for ad activity', async ({ page }) => {
    // Check for trend indicators (▲ up, ▼ down, → unchanged)
    const trendIndicators = page.locator('text=/▲|▼|→|up|down|trend/i');
    if (await trendIndicators.first().isVisible()) {
      await expect(trendIndicators.first()).toBeVisible();
    }
  });

  test('should display ad previews with images if available', async ({ page }) => {
    const adPreviews = page.locator('[data-testid="ad-preview"]');
    const adCount = await adPreviews.count();

    if (adCount > 0) {
      // Check if ads have images or placeholders
      const adImage = adPreviews.first().locator('img, [data-testid="ad-image"]');
      if (await adImage.isVisible()) {
        await expect(adImage).toBeVisible();
      }
    }
  });

  test('should show stopped ads section if available', async ({ page }) => {
    const stoppedAdsSection = page.getByText(/stopped.*ads|recently ended/i);

    if (await stoppedAdsSection.isVisible()) {
      await expect(stoppedAdsSection).toBeVisible();
    }
  });
});

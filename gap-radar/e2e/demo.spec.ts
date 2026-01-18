import { test, expect } from '@playwright/test';

test.describe('Demo Niches Page', () => {
  test('should display demo page without authentication', async ({ page }) => {
    // Visit demo page without logging in
    await page.goto('/demo');

    // Should not redirect to login
    await expect(page).toHaveURL('/demo');

    // Page should have a title/heading
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display at least 3 demo niches', async ({ page }) => {
    await page.goto('/demo');

    // Should have at least 3 demo niche cards
    const nicheCards = page.locator('[data-testid="demo-niche-card"]');
    await expect(nicheCards).toHaveCount(3, { timeout: 5000 });
  });

  test('demo niche cards should show key information', async ({ page }) => {
    await page.goto('/demo');

    // First card should have niche name, opportunity score, and category
    const firstCard = page.locator('[data-testid="demo-niche-card"]').first();
    await expect(firstCard.locator('[data-testid="niche-name"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="opportunity-score"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="niche-category"]')).toBeVisible();
  });

  test('should have CTA to signup', async ({ page }) => {
    await page.goto('/demo');

    // Should have a signup CTA button
    const signupButton = page.locator('text=/Sign up|Get Started/i').first();
    await expect(signupButton).toBeVisible();
  });

  test('clicking a demo niche should show instant preview', async ({ page }) => {
    await page.goto('/demo');

    // Click first demo niche
    const firstCard = page.locator('[data-testid="demo-niche-card"]').first();
    await firstCard.click();

    // Should show some preview content (either modal or new section)
    const preview = page.locator('[data-testid="demo-preview"]');
    await expect(preview).toBeVisible({ timeout: 3000 });
  });

  test('demo preview should show summary data without requiring auth', async ({ page }) => {
    await page.goto('/demo');

    // Click first demo niche to open preview
    const firstCard = page.locator('[data-testid="demo-niche-card"]').first();
    await firstCard.click();

    // Preview should show opportunity score
    const preview = page.locator('[data-testid="demo-preview"]');
    await expect(preview.locator('text=/opportunity/i')).toBeVisible();

    // Should show some gap information
    await expect(preview.locator('text=/gap|insight/i')).toBeVisible();
  });

  test('demo preview should have CTA to create full report', async ({ page }) => {
    await page.goto('/demo');

    // Click first demo niche
    await page.locator('[data-testid="demo-niche-card"]').first().click();

    // Preview should have CTA to create full report (requires signup)
    const preview = page.locator('[data-testid="demo-preview"]');
    const ctaButton = preview.locator('text=/Create Full Report|Get Full Analysis/i');
    await expect(ctaButton).toBeVisible();
  });
});

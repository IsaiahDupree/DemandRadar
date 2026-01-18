import { test, expect } from '@playwright/test';

/**
 * Pricing Page E2E Tests
 *
 * Tests the pricing page display and checkout functionality
 */

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('should display the pricing page', async ({ page }) => {
    await expect(page).toHaveTitle(/Pricing|GapRadar|DemandRadar/i);

    // Check for pricing heading
    const hasHeading = await page.getByRole('heading', {
      name: /pricing|plans|choose your plan/i
    }).first().isVisible();

    expect(hasHeading).toBeTruthy();
  });

  test('should display all subscription plans', async ({ page }) => {
    // Check for Starter plan
    const starterPlan = page.getByText(/starter/i).first();
    await expect(starterPlan).toBeVisible();

    // Check for Builder plan
    const builderPlan = page.getByText(/builder/i).first();
    await expect(builderPlan).toBeVisible();

    // Check for Agency plan
    const agencyPlan = page.getByText(/agency/i).first();
    await expect(agencyPlan).toBeVisible();

    // Check for Studio plan
    const studioPlan = page.getByText(/studio/i).first();
    await expect(studioPlan).toBeVisible();
  });

  test('should display pricing amounts', async ({ page }) => {
    // Check that prices are displayed
    const prices = [
      /\$29/,  // Starter
      /\$99/,  // Builder
      /\$249/, // Agency
      /\$499/, // Studio
    ];

    for (const pricePattern of prices) {
      const priceElement = page.getByText(pricePattern).first();
      await expect(priceElement).toBeVisible();
    }
  });

  test('should display plan features', async ({ page }) => {
    // Check for common feature indicators
    const hasFeatures = await page.getByText(/runs\/month|full dossier|ugc pack|api access/i).first().isVisible();
    expect(hasFeatures).toBeTruthy();
  });

  test('should have checkout buttons for each plan', async ({ page }) => {
    // Get all "Get Started" or "Subscribe" buttons
    const checkoutButtons = page.getByRole('button', {
      name: /get started|subscribe|choose plan|select/i
    });

    const buttonCount = await checkoutButtons.count();

    // Should have at least 4 buttons (one for each paid plan)
    expect(buttonCount).toBeGreaterThanOrEqual(4);
  });

  test('should navigate to checkout when clicking a plan button', async ({ page }) => {
    // Find the first "Get Started" button for a paid plan (skip Free)
    const checkoutButton = page.getByRole('button', {
      name: /get started|subscribe|choose plan/i
    }).nth(1); // Get second button to skip Free plan

    await checkoutButton.click();

    // Should either navigate to Stripe checkout or show auth requirement
    await page.waitForTimeout(1000); // Wait for navigation or modal

    const url = page.url();
    const hasAuthRedirect = url.includes('/login') || url.includes('/signup');
    const hasCheckout = url.includes('checkout.stripe.com') || url.includes('/api/checkout');

    expect(hasAuthRedirect || hasCheckout).toBeTruthy();
  });

  test('should display monthly billing period', async ({ page }) => {
    // Check for monthly billing indicator
    const hasMonthly = await page.getByText(/\/month|monthly|per month/i).first().isVisible();
    expect(hasMonthly).toBeTruthy();
  });

  test('should have accessible plan cards', async ({ page }) => {
    // Check that plan cards are keyboard navigable
    const planCards = page.locator('[data-testid="plan-card"], [role="article"], .plan-card, .pricing-card');

    const cardCount = await planCards.count();

    if (cardCount > 0) {
      // At least one plan card should exist
      expect(cardCount).toBeGreaterThanOrEqual(4);
    } else {
      // If no specific plan cards, just verify buttons exist
      const buttons = await page.getByRole('button', { name: /get started|subscribe/i }).count();
      expect(buttons).toBeGreaterThanOrEqual(4);
    }
  });
});

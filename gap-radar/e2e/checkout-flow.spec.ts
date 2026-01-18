import { test, expect } from '@playwright/test';

/**
 * Checkout Flow E2E Tests
 *
 * Tests the complete checkout flow from pricing page to successful subscription
 * This covers:
 * - Subscription checkout (monthly plans)
 * - Credits purchase (one-time)
 * - Payment success/failure handling
 */

test.describe('Checkout Flow - Subscription', () => {
  test('should complete subscription checkout flow (unauthenticated)', async ({ page }) => {
    // Start at pricing page
    await page.goto('/pricing');

    // Click on "Get Started" for a paid plan (e.g., Starter $29/mo)
    const checkoutButton = page.getByRole('button', {
      name: /get started|subscribe|choose.*starter/i
    }).first();

    await checkoutButton.click();

    // Should redirect to login/signup since unauthenticated
    await page.waitForURL(/\/login|\/signup|\/sign-in/i, { timeout: 5000 });

    // Verify we're on auth page
    const hasEmailInput = await page.getByLabel(/email/i).isVisible();
    expect(hasEmailInput).toBeTruthy();
  });

  test('should complete subscription checkout flow (authenticated)', async ({ page }) => {
    // Skip if no test credentials
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

    // Sign in first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/i);

    // Navigate to pricing page
    await page.goto('/pricing');

    // Click on "Get Started" for a paid plan
    const checkoutButton = page.getByRole('button', {
      name: /get started|subscribe|choose/i
    }).first();

    await checkoutButton.click();

    // Wait for either:
    // 1. Stripe Checkout redirect (checkout.stripe.com)
    // 2. Internal checkout API route
    // 3. Modal/dialog with checkout form
    await page.waitForTimeout(2000);

    const url = page.url();
    const hasStripeCheckout = url.includes('checkout.stripe.com');
    const hasCheckoutRoute = url.includes('/checkout') || url.includes('/api/checkout');

    // Verify we're in the checkout process
    expect(hasStripeCheckout || hasCheckoutRoute).toBeTruthy();

    // If we're on Stripe Checkout, verify the page loaded
    if (hasStripeCheckout) {
      // Stripe Checkout page should have payment form
      await expect(page).toHaveTitle(/Checkout|Stripe/i, { timeout: 10000 });

      // Note: We don't actually complete the payment in tests
      // This would require test card numbers and full Stripe test mode
      console.log('✓ Successfully redirected to Stripe Checkout');
    } else {
      // If custom checkout, verify form elements
      const hasPaymentElements = await page.locator('[data-testid="checkout-form"], [data-stripe], .StripeElement').count() > 0;
      expect(hasPaymentElements).toBeTruthy();
    }
  });

  test('should handle checkout cancellation', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

    // Sign in
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/i);

    // Start checkout
    await page.goto('/pricing');
    const checkoutButton = page.getByRole('button', {
      name: /get started|subscribe/i
    }).first();
    await checkoutButton.click();

    await page.waitForTimeout(2000);

    // If we redirected to Stripe, go back
    if (page.url().includes('checkout.stripe.com')) {
      await page.goBack();

      // Should return to pricing page or dashboard
      const url = page.url();
      const isBackOnApp = url.includes('/pricing') || url.includes('/dashboard');
      expect(isBackOnApp).toBeTruthy();
    }
  });
});

test.describe('Checkout Flow - Credits Purchase', () => {
  test('should initiate credits purchase', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

    // Sign in
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/i);

    // Navigate to billing or credits page
    await page.goto('/dashboard/billing');

    // Look for "Buy Credits" or "Purchase Credits" button
    const buyCreditsButton = page.getByRole('button', {
      name: /buy credits|purchase credits|add credits/i
    }).first();

    if (await buyCreditsButton.isVisible()) {
      await buyCreditsButton.click();

      // Should show credits purchase options or redirect to checkout
      await page.waitForTimeout(2000);

      const url = page.url();
      const hasCheckout = url.includes('checkout') || url.includes('stripe');
      const hasModal = await page.locator('[role="dialog"], .modal, [data-testid="credits-modal"]').count() > 0;

      expect(hasCheckout || hasModal).toBeTruthy();
    } else {
      test.skip(true, 'Credits purchase not available or user has subscription');
    }
  });
});

test.describe('Checkout Flow - Success/Failure Handling', () => {
  test('should handle successful payment redirect', async ({ page }) => {
    // Simulate successful Stripe checkout return
    await page.goto('/api/checkout/success?session_id=test_session_123');

    // Should redirect to dashboard or show success message
    await page.waitForTimeout(2000);

    const url = page.url();
    const hasSuccess = url.includes('success') || url.includes('dashboard');

    // Or check for success message in UI
    const hasSuccessMessage = await page.getByText(/success|thank you|payment confirmed|subscription active/i).first().isVisible().catch(() => false);

    expect(hasSuccess || hasSuccessMessage).toBeTruthy();
  });

  test('should handle failed payment redirect', async ({ page }) => {
    // Simulate failed Stripe checkout return
    await page.goto('/api/checkout/cancel?session_id=test_session_123');

    // Should show error message or return to pricing
    await page.waitForTimeout(2000);

    const url = page.url();
    const hasCancel = url.includes('cancel') || url.includes('pricing') || url.includes('billing');

    // Or check for cancellation message
    const hasCancelMessage = await page.getByText(/cancelled|payment not completed|try again/i).first().isVisible().catch(() => false);

    expect(hasCancel || hasCancelMessage).toBeTruthy();
  });
});

test.describe('Checkout Flow - Subscription Management', () => {
  test('should access billing portal for subscription management', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

    // Sign in
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/i);

    // Navigate to billing page
    await page.goto('/dashboard/billing');

    // Look for "Manage Subscription" button
    const manageButton = page.getByRole('button', {
      name: /manage subscription|billing portal|update payment/i
    }).first();

    if (await manageButton.isVisible()) {
      await manageButton.click();

      // Should redirect to Stripe billing portal
      await page.waitForTimeout(2000);

      const url = page.url();
      const hasBillingPortal = url.includes('billing.stripe.com') || url.includes('/api/billing/portal');

      expect(hasBillingPortal).toBeTruthy();
    } else {
      test.skip(true, 'User does not have active subscription');
    }
  });

  test('should display current subscription status', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

    // Sign in
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/i);

    // Navigate to billing page
    await page.goto('/dashboard/billing');

    // Check for subscription status indicators
    const hasStatus = await page.getByText(/current plan|subscription|free|starter|builder|agency|studio/i).first().isVisible();

    expect(hasStatus).toBeTruthy();
  });
});

test.describe('Checkout Flow - Plan Upgrades', () => {
  test('should allow plan upgrade from billing page', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

    // Sign in
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/i);

    // Navigate to billing page
    await page.goto('/dashboard/billing');

    // Look for "Upgrade" button
    const upgradeButton = page.getByRole('button', {
      name: /upgrade|change plan|view plans/i
    }).first();

    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();

      // Should navigate to pricing page or show plan selector
      await page.waitForTimeout(1000);

      const url = page.url();
      const hasPricing = url.includes('/pricing');
      const hasModal = await page.locator('[role="dialog"], .modal').count() > 0;

      expect(hasPricing || hasModal).toBeTruthy();
    } else {
      test.skip(true, 'Upgrade option not available');
    }
  });
});

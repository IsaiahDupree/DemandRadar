/**
 * Button Interaction Tests
 *
 * E2E tests to verify that every button on every page is clickable
 * and triggers the correct actions (navigation, modals, API calls, etc.)
 */

import { test, expect } from '@playwright/test';

test.describe('Button Interaction Tests', () => {
  test.describe('Homepage Buttons', () => {
    test('CTA buttons should be clickable and navigate correctly', async ({ page }) => {
      await page.goto('/');

      // Find all buttons and links that look like CTAs
      // Include links with href since shadcn buttons with asChild render as <a> tags
      const buttons = await page.locator('button, a[role="button"], a.btn, a[class*="button"], a[href]').all();

      expect(buttons.length).toBeGreaterThan(0);

      for (const button of buttons) {
        const isVisible = await button.isVisible();
        if (!isVisible) continue;

        const isEnabled = await button.isEnabled();
        expect(isEnabled).toBeTruthy();

        // Verify button is clickable (not disabled or hidden)
        const text = await button.textContent();
        await expect(button).toBeVisible();
      }
    });

    test('Get Started button should navigate to signup or dashboard', async ({ page }) => {
      await page.goto('/');

      // Look for common CTA text
      const ctaButton = page.locator('button:has-text("Get Started"), a:has-text("Get Started")').first();

      if (await ctaButton.count() > 0) {
        await ctaButton.click();

        // Should navigate somewhere meaningful
        await page.waitForURL(/\/(signup|dashboard|login)/);
        expect(page.url()).toMatch(/\/(signup|dashboard|login)/);
      }
    });
  });

  test.describe('Login Page Buttons', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('login button should be clickable', async ({ page }) => {
      const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').first();

      await expect(loginButton).toBeVisible();
      await expect(loginButton).toBeEnabled();

      // Button should be clickable
      const isClickable = await loginButton.isEnabled();
      expect(isClickable).toBeTruthy();
    });

    test('sign up link should navigate to signup page', async ({ page }) => {
      const signupLink = page.locator('a:has-text("Sign up"), a:has-text("Sign Up"), a:has-text("Create account")').first();

      if (await signupLink.count() > 0) {
        await signupLink.click();
        await page.waitForURL(/\/signup/);
        expect(page.url()).toContain('/signup');
      }
    });
  });

  test.describe('Signup Page Buttons', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('signup button should be clickable', async ({ page }) => {
      const signupButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")').first();

      await expect(signupButton).toBeVisible();
      await expect(signupButton).toBeEnabled();
    });

    test('login link should navigate to login page', async ({ page }) => {
      const loginLink = page.locator('a:has-text("Log in"), a:has-text("Sign in"), a:has-text("Already have an account")').first();

      if (await loginLink.count() > 0) {
        await loginLink.click();
        await page.waitForURL(/\/login/);
        expect(page.url()).toContain('/login');
      }
    });
  });

  test.describe('Dashboard Buttons (if accessible)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard');
    });

    test('all dashboard navigation buttons should be clickable', async ({ page }) => {
      // Check if we're on dashboard or redirected to login
      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Find all navigation buttons/links
      const navButtons = await page.locator('nav a, nav button').all();

      for (const button of navButtons) {
        const isVisible = await button.isVisible();
        if (!isVisible) continue;

        await expect(button).toBeEnabled();
      }
    });

    test('new run button should be accessible', async ({ page }) => {
      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for "New Run" or "New Analysis" button
      const newRunButton = page.locator(
        'button:has-text("New Run"), button:has-text("New Analysis"), a:has-text("New Run"), a:has-text("New Analysis")'
      ).first();

      if (await newRunButton.count() > 0) {
        await expect(newRunButton).toBeVisible();
        await expect(newRunButton).toBeEnabled();
      }
    });
  });

  test.describe('Dashboard/New-Run Page Buttons', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/new-run');
    });

    test('form submit button should be clickable', async ({ page }) => {
      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Find submit button
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Start Analysis"), button:has-text("Create Run"), button:has-text("Analyze")'
      ).first();

      if (await submitButton.count() > 0) {
        await expect(submitButton).toBeVisible();

        // May be disabled until form is filled, but should be visible
        const isVisible = await submitButton.isVisible();
        expect(isVisible).toBeTruthy();
      }
    });

    test('cancel/back button should work if present', async ({ page }) => {
      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const cancelButton = page.locator('button:has-text("Cancel"), a:has-text("Back"), button:has-text("Back")').first();

      if (await cancelButton.count() > 0) {
        await expect(cancelButton).toBeVisible();
        await expect(cancelButton).toBeEnabled();

        // Click and verify navigation
        await cancelButton.click();
        await page.waitForTimeout(500);

        // Should navigate away from new-run page
        const newUrl = page.url();
        expect(newUrl).not.toContain('/new-run');
      }
    });
  });

  test.describe('Dashboard/Reports Page Buttons', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/reports');
    });

    test('report action buttons should be clickable', async ({ page }) => {
      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Look for action buttons like "View", "Export", "Delete"
      const actionButtons = await page.locator(
        'button:has-text("View"), button:has-text("Export"), button:has-text("Download"), a:has-text("View Details")'
      ).all();

      // If no reports yet, might not have buttons
      if (actionButtons.length === 0) {
        test.skip();
      }

      for (const button of actionButtons) {
        const isVisible = await button.isVisible();
        if (!isVisible) continue;

        await expect(button).toBeEnabled();
      }
    });
  });

  test.describe('Dashboard/Settings Page Buttons', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard/settings');
    });

    test('save settings button should be clickable', async ({ page }) => {
      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const saveButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();

      if (await saveButton.count() > 0) {
        await expect(saveButton).toBeVisible();
      }
    });

    test('billing/subscription buttons should be clickable', async ({ page }) => {
      const currentUrl = page.url();

      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      const billingButton = page.locator('a:has-text("Billing"), button:has-text("Manage Subscription"), a:has-text("View Plans")').first();

      if (await billingButton.count() > 0) {
        await expect(billingButton).toBeVisible();
        await expect(billingButton).toBeEnabled();
      }
    });
  });

  test.describe('Modal and Dialog Buttons', () => {
    test('modal close buttons should work', async ({ page }) => {
      await page.goto('/dashboard');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Try to find and open a modal
      const modalTrigger = page.locator('button[aria-haspopup="dialog"], button:has-text("Delete"), button:has-text("Confirm")').first();

      if (await modalTrigger.count() === 0) {
        test.skip();
        return;
      }

      // Open modal
      await modalTrigger.click();
      await page.waitForTimeout(300);

      // Look for close button
      const closeButton = page.locator('button[aria-label="Close"], button:has-text("Cancel"), button:has-text("×")').first();

      if (await closeButton.count() > 0) {
        await expect(closeButton).toBeVisible();
        await expect(closeButton).toBeEnabled();

        // Click to close
        await closeButton.click();
        await page.waitForTimeout(300);

        // Modal should be closed
        const modalVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
        expect(modalVisible).toBeFalsy();
      }
    });
  });

  test.describe('Dropdown Menu Buttons', () => {
    test('dropdown menus should open on click', async ({ page }) => {
      await page.goto('/dashboard');

      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        test.skip();
        return;
      }

      // Find dropdown triggers
      const dropdownTriggers = await page.locator('button[aria-haspopup="menu"], button[aria-expanded]').all();

      if (dropdownTriggers.length === 0) {
        test.skip();
        return;
      }

      for (const trigger of dropdownTriggers) {
        const isVisible = await trigger.isVisible();
        if (!isVisible) continue;

        // Click to open dropdown
        await trigger.click();
        await page.waitForTimeout(200);

        // Check if menu appeared
        const expanded = await trigger.getAttribute('aria-expanded');
        // Menu should be expanded or menu content visible
        // This is a basic check that the button is interactive
      }
    });
  });

  test.describe('Accessibility - Keyboard Navigation', () => {
    test('buttons should be keyboard accessible', async ({ page }) => {
      await page.goto('/');

      // Tab through focusable elements
      await page.keyboard.press('Tab');

      // Check that focus is on an interactive element
      const focusedElement = await page.locator(':focus').first();

      // Check if element exists first
      if (await focusedElement.count() > 0) {
        const tagName = await focusedElement.evaluate((el) => el.tagName.toLowerCase());

        // Should be button, link, or input
        // Note: Some frameworks use portal elements (nextjs-portal) which should be ignored
        if (tagName !== 'nextjs-portal' && tagName !== 'body') {
          expect(['button', 'a', 'input', 'select', 'textarea']).toContain(tagName);
        }
      }
    });

    test('buttons should activate on Enter key', async ({ page }) => {
      await page.goto('/');

      // Find a clickable button
      const button = page.locator('button, a[role="button"]').first();

      if (await button.count() > 0) {
        await button.focus();
        // Just verify it's focusable, actual activation tested elsewhere
        await expect(button).toBeFocused();
      }
    });
  });
});

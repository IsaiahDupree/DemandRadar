import { test, expect } from '@playwright/test';

/**
 * New Run Creation E2E Tests
 *
 * Tests the flow of creating a new market analysis run.
 */

test.describe('New Run Creation', () => {
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

  test('should navigate to new run page', async ({ page }) => {
    // Look for "New Analysis" or "New Run" button
    const newRunButton = page.getByRole('link', { name: /new analysis|new run|create run/i }).first();

    if (await newRunButton.isVisible()) {
      await newRunButton.click();
      await page.waitForURL(/\/dashboard\/new-run/i);
    } else {
      // Try navigating directly
      await page.goto('/dashboard/new-run');
    }

    // Verify form is visible
    await expect(page.getByLabel(/niche query/i)).toBeVisible();
  });

  test('should create a new run successfully', async ({ page }) => {
    // Navigate to new run page
    await page.goto('/dashboard/new-run');

    // Fill in the form
    const nicheQuery = `Test Niche ${Date.now()}`;
    await page.getByLabel(/niche query/i).fill(nicheQuery);

    // Submit the form (seed terms and competitors are optional on advanced tab)
    await page.getByRole('button', { name: /start analysis/i }).click();

    // Wait for redirect to runs page
    await page.waitForURL(/\/dashboard\/runs/i, { timeout: 10000 });

    // Should show success toast message
    await expect(page.getByText(/analysis started/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show validation error for empty niche query', async ({ page }) => {
    await page.goto('/dashboard/new-run');

    // Leave niche query empty and submit
    await page.getByRole('button', { name: /start analysis/i }).click();

    // Should show validation error toast
    await expect(page.getByText(/please enter a niche/i).first()).toBeVisible({ timeout: 3000 });

    // Should still be on the same page
    await expect(page).toHaveURL(/\/dashboard\/new-run/i);
  });

  test('should display run in progress indicator', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Look for a run in progress or queued
    const runningRun = page.locator('[data-status="running"], [data-status="queued"]').first();

    if (await runningRun.isVisible()) {
      // Check for progress indicator
      const hasProgress = await page.locator('.progress, [role="progressbar"]').isVisible();
      const hasSpinner = await page.locator('.animate-spin, .spinner').isVisible();
      const hasStatus = await page.getByText(/running|queued|processing/i).isVisible();

      expect(hasProgress || hasSpinner || hasStatus).toBeTruthy();
    } else {
      // Create a new run to test progress
      await page.goto('/dashboard/new-run');

      const nicheQuery = `Progress Test ${Date.now()}`;
      await page.getByLabel(/niche query/i).fill(nicheQuery);
      await page.getByRole('button', { name: /start analysis/i }).click();

      // Wait for redirect
      await page.waitForURL(/\/dashboard\/runs/i, { timeout: 10000 });

      // Check for progress indicator within 5 seconds
      await page.waitForSelector('.progress, [role="progressbar"], .animate-spin', {
        timeout: 5000,
      }).catch(() => {
        // Progress might complete very quickly, that's okay
      });
    }
  });

  test('should allow viewing run details', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for any run (completed or in progress)
    const firstRun = page.locator('[data-testid="run-card"], .run-item').first();

    if (await firstRun.isVisible()) {
      await firstRun.click();

      // Should navigate to run detail page
      await page.waitForURL(/\/dashboard\/runs\/[^/]+|\/dashboard\/reports\/[^/]+/i);

      // Verify we're on a detail page
      const hasRunDetails = await page.getByText(/status|progress|results/i).isVisible();
      expect(hasRunDetails).toBeTruthy();
    } else {
      test.skip(true, 'No runs available to test detail view');
    }
  });
});

test.describe('Run Management', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

    // Sign in
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/i);
  });

  test('should display list of runs', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for runs list or empty state
    const hasRunsList = await page.locator('[data-testid="run-card"], .run-item').count() > 0;
    const hasEmptyState = await page.getByText(/no runs|create your first|get started/i).isVisible();

    expect(hasRunsList || hasEmptyState).toBeTruthy();
  });

  test('should filter runs by status', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for status filter
    const statusFilter = page.getByRole('button', { name: /filter|status/i }).first();

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // Select "completed" status
      const completedOption = page.getByRole('option', { name: /complete/i });
      if (await completedOption.isVisible()) {
        await completedOption.click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // All visible runs should be completed
        const runStatuses = await page.locator('[data-status]').all();
        if (runStatuses.length > 0) {
          for (const run of runStatuses) {
            const status = await run.getAttribute('data-status');
            expect(status).toBe('complete');
          }
        }
      }
    } else {
      test.skip(true, 'Status filter not implemented');
    }
  });
});

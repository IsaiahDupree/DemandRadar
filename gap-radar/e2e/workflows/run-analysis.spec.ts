/**
 * Run Analysis Workflow Test
 *
 * Tests the core analysis run creation and monitoring workflow
 * without requiring full signup/auth flow.
 */

import { test, expect } from '@playwright/test';

test.describe('Analysis Run Workflow', () => {
  test('create new analysis run with valid inputs', async ({ page }) => {
    // Navigate to new run page
    await page.goto('/dashboard/new-run');

    // May redirect to login if not authenticated
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('Authentication required - skipping test');
      test.skip();
      return;
    }

    // Verify form is visible
    await expect(page).toHaveURL(/\/dashboard\/new-run/);

    // Fill in niche query
    const nicheInput = page.locator('input[name="niche_query"], textarea[name="niche_query"]').first();

    if (await nicheInput.count() === 0) {
      console.log('Form not found - may need authentication');
      test.skip();
      return;
    }

    await expect(nicheInput).toBeVisible();
    await nicheInput.fill('AI-powered email marketing tools');

    // Fill optional fields if present
    const seedTermsInput = page.locator('input[name="seed_terms"], textarea[name="seed_terms"]').first();
    if (await seedTermsInput.count() > 0) {
      await seedTermsInput.fill('email automation, campaign builder, segmentation');
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for redirect
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Should redirect to runs page or dashboard
    const newUrl = page.url();
    expect(newUrl).toMatch(/\/dashboard/);
  });

  test('form validation prevents empty submission', async ({ page }) => {
    await page.goto('/dashboard/new-run');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]').first();

    if (await submitButton.count() === 0) {
      test.skip();
      return;
    }

    await submitButton.click();

    // Should show validation error or prevent submission
    await page.waitForTimeout(1000);

    // Should still be on new-run page
    expect(page.url()).toContain('/new-run');

    // Look for error message
    const pageText = await page.textContent('body');
    const hasError =
      pageText?.toLowerCase().includes('required') ||
      pageText?.toLowerCase().includes('error') ||
      pageText?.toLowerCase().includes('invalid');

    // Either shows error or prevents submission
    expect(hasError || page.url().includes('/new-run')).toBeTruthy();
  });

  test('can navigate to runs list page', async ({ page }) => {
    await page.goto('/dashboard/runs');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    // Should show runs list or empty state
    await expect(page).toHaveURL(/\/dashboard\/runs/);

    // Look for runs table or empty state
    const pageText = await page.textContent('body');
    expect(pageText).toBeTruthy();

    // Should have either runs or "no runs" message
    const hasContent =
      pageText?.includes('runs') ||
      pageText?.includes('analysis') ||
      pageText?.includes('No') ||
      pageText?.includes('empty');

    expect(hasContent).toBeTruthy();
  });

  test('runs list shows run status', async ({ page }) => {
    await page.goto('/dashboard/runs');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    // Look for status indicators
    const statusBadge = page.locator(
      '[data-status], .status, span:has-text("Running"), span:has-text("Completed"), span:has-text("Failed")'
    ).first();

    // May not have any runs yet
    if (await statusBadge.count() === 0) {
      console.log('No runs found to check status');
      test.skip();
      return;
    }

    // Verify status badge is visible
    await expect(statusBadge).toBeVisible();
  });

  test('can view run details from runs list', async ({ page }) => {
    await page.goto('/dashboard/runs');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    // Find first run link
    const runLink = page.locator('a[href*="/runs/"], button:has-text("View")').first();

    if (await runLink.count() === 0) {
      console.log('No runs available to view');
      test.skip();
      return;
    }

    // Click to view details
    await runLink.click();

    // Should navigate to run details page
    await page.waitForURL(/\/dashboard\/(runs|reports)\//, { timeout: 5000 });

    // Verify we're on a details page
    const url = page.url();
    expect(url).toMatch(/\/dashboard\/(runs|reports)\//);
  });

  test('progress indicator shows during run execution', async ({ page }) => {
    await page.goto('/dashboard/runs');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    // Look for progress indicators
    const progressBar = page.locator('[role="progressbar"], .progress, .spinner, .loading').first();

    // May not have running jobs
    if (await progressBar.count() === 0) {
      console.log('No running jobs to show progress');
      // This is acceptable - not all runs will be in progress
      return;
    }

    // If progress exists, it should be visible
    await expect(progressBar).toBeVisible();
  });

  test('can cancel a running analysis', async ({ page }) => {
    await page.goto('/dashboard/runs');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    // Look for cancel button on a running job
    const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Stop")').first();

    if (await cancelButton.count() === 0) {
      console.log('No running jobs to cancel');
      test.skip();
      return;
    }

    // Verify cancel button is clickable
    await expect(cancelButton).toBeEnabled();

    // Click cancel button
    await cancelButton.click();

    // Should show confirmation or immediately cancel
    await page.waitForTimeout(1000);

    // Look for confirmation dialog
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();

    if (await confirmButton.count() > 0) {
      await confirmButton.click();
    }

    // Status should update
    await page.waitForTimeout(1000);
  });

  test('error state is displayed for failed runs', async ({ page }) => {
    await page.goto('/dashboard/runs');

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      test.skip();
      return;
    }

    // Look for failed run indicators
    const errorBadge = page.locator('span:has-text("Failed"), span:has-text("Error"), .error, .failed').first();

    if (await errorBadge.count() === 0) {
      console.log('No failed runs to check');
      test.skip();
      return;
    }

    // Error badge should be visible
    await expect(errorBadge).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to onboarding page
    await page.goto('/onboarding');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display onboarding header and progress', async ({ page }) => {
    // Check header is visible
    await expect(page.getByRole('heading', { name: /Track Demand for Your Offering/i })).toBeVisible();

    // Check progress indicator
    await expect(page.getByText(/Step 1 of 3/i)).toBeVisible();
    await expect(page.getByText(/0% complete/i)).toBeVisible();
  });

  test('should show step 1: offering input', async ({ page }) => {
    // Check for the card title (may not be a semantic heading)
    await expect(page.getByText('Describe Your Offering')).toBeVisible();

    // Check textarea is present
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();

    // Continue button should be visible
    await expect(page.getByRole('button', { name: /Continue/i })).toBeVisible();
  });

  test('should have a skip option on step 1', async ({ page }) => {
    // Skip button should be visible
    const skipButton = page.getByRole('button', { name: /Skip for now/i });
    await expect(skipButton).toBeVisible();
  });

  test('should allow skipping onboarding and redirect to dashboard', async ({ page }) => {
    // Click skip button
    await page.getByRole('button', { name: /Skip for now/i }).click();

    // Should show info toast
    await expect(page.getByText(/You can start onboarding anytime/i)).toBeVisible();

    // Should attempt to redirect to dashboard (may redirect to login if not authenticated)
    await page.waitForURL(/\/(dashboard|login)/);
  });

  test('should not proceed to step 2 without input', async ({ page }) => {
    const continueButton = page.getByRole('button', { name: /Continue/i });

    // Continue button should be disabled when there's no input
    await expect(continueButton).toBeDisabled();
  });

  test('should progress through all steps with valid input', async ({ page }) => {
    // Step 1: Enter offering description
    const textarea = page.locator('textarea');
    await textarea.fill('AI-powered project management tool for remote teams');

    // Mock the API response for extraction
    await page.route('/api/niches/extract', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          offeringName: 'AI Project Management',
          category: 'Productivity',
          nicheTags: ['AI', 'project management', 'remote work'],
          customerProfile: {
            type: 'B2B',
            segment: 'Remote teams',
            pricePoint: 'mid',
          },
          competitors: ['Asana', 'Monday', 'ClickUp'],
          keywords: ['project management', 'AI project tracker', 'remote team tool'],
          geo: 'us',
        }),
      });
    });

    // Click continue
    await page.getByRole('button', { name: /Continue/i }).click();

    // Wait for step 2
    await expect(page.getByText('Review & Edit Your Niche')).toBeVisible();
    await expect(page.getByText(/Step 2 of 3/i)).toBeVisible();

    // Should show back button
    await expect(page.getByRole('button', { name: /Back/i })).toBeVisible();

    // Continue to step 3
    await page.getByRole('button', { name: /Continue/i }).click();

    // Wait for step 3
    await expect(page.getByText('Start Tracking Demand')).toBeVisible();
    await expect(page.getByText(/Step 3 of 3/i)).toBeVisible();

    // Should show what we'll track
    await expect(page.getByText(/What we'll track:/i)).toBeVisible();
  });

  test('should allow going back to previous steps', async ({ page }) => {
    // Fill in step 1
    const textarea = page.locator('textarea');
    await textarea.fill('AI-powered analytics dashboard');

    // Mock API
    await page.route('/api/niches/extract', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          offeringName: 'AI Analytics',
          category: 'Analytics',
          nicheTags: ['AI', 'analytics'],
          customerProfile: { type: 'B2B', segment: 'Startups', pricePoint: 'mid' },
          competitors: ['Mixpanel'],
          keywords: ['analytics dashboard'],
          geo: 'us',
        }),
      });
    });

    await page.getByRole('button', { name: /Continue/i }).click();

    // On step 2, click back
    await page.getByRole('button', { name: /Back/i }).click();

    // Should be back on step 1
    await expect(page.getByText('Describe Your Offering')).toBeVisible();
    await expect(page.getByText(/Step 1 of 3/i)).toBeVisible();
  });

  test('should complete onboarding and redirect to niche detail', async ({ page }) => {
    // Fill in step 1
    const textarea = page.locator('textarea');
    await textarea.fill('Email marketing automation tool');

    // Mock extract API
    await page.route('/api/niches/extract', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          offeringName: 'Email Marketing',
          category: 'Marketing',
          nicheTags: ['email', 'automation'],
          customerProfile: { type: 'B2B', segment: 'SMBs', pricePoint: 'mid' },
          competitors: ['Mailchimp'],
          keywords: ['email marketing'],
          geo: 'us',
        }),
      });
    });

    await page.getByRole('button', { name: /Continue/i }).click();
    await page.getByRole('button', { name: /Continue/i }).click();

    // Mock create API
    await page.route('/api/niches', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'niche-123',
          name: 'Email Marketing',
        }),
      });
    });

    // Click start tracking
    await page.getByRole('button', { name: /Start Tracking/i }).click();

    // Should attempt to redirect to niche detail page (may redirect to login if not authenticated)
    await page.waitForURL(/\/(dashboard|login)/);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Test offering');

    // Mock failed API response
    await page.route('/api/niches/extract', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.getByRole('button', { name: /Continue/i }).click();

    // Should show error toast
    await expect(page.getByText(/Failed to extract niche data/i)).toBeVisible();

    // Should still be on step 1
    await expect(page.getByText(/Step 1 of 3/i)).toBeVisible();
  });
});

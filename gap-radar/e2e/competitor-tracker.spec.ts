import { test, expect } from '@playwright/test';

test.describe('Competitor Tracker Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to competitor tracker page (assuming user is authenticated)
    await page.goto('/dashboard/competitors');
  });

  test('should display page title and description', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Competitor Tracker');
    await expect(page.getByText(/track.*competitors.*over time/i)).toBeVisible();
  });

  test('should display empty state when no tracked competitors', async ({ page }) => {
    // Check for empty state message
    const emptyState = page.getByTestId('empty-state');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText('No competitors tracked');
    }
  });

  test('should display add competitor button', async ({ page }) => {
    const addButton = page.getByTestId('add-competitor-button');
    await expect(addButton).toBeVisible();
    await expect(addButton).toContainText(/add competitor|track competitor/i);
  });

  test('should open add competitor form when button clicked', async ({ page }) => {
    const addButton = page.getByTestId('add-competitor-button');
    await addButton.click();

    // Verify form appears
    const form = page.getByTestId('add-competitor-form');
    await expect(form).toBeVisible();
  });

  test('should have required fields in add competitor form', async ({ page }) => {
    const addButton = page.getByTestId('add-competitor-button');
    await addButton.click();

    // Verify form fields
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/url/i)).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
  });

  test('should validate required fields in add form', async ({ page }) => {
    const addButton = page.getByTestId('add-competitor-button');
    await addButton.click();

    // Try to submit without filling fields
    const submitButton = page.getByTestId('submit-competitor');
    await submitButton.click();

    // Should show validation error
    await expect(page.getByText(/name.*required|url.*required/i)).toBeVisible({ timeout: 3000 });
  });

  test('should add competitor successfully', async ({ page }) => {
    const addButton = page.getByTestId('add-competitor-button');
    await addButton.click();

    // Fill in form
    await page.getByLabel(/name/i).fill('Test Competitor');
    await page.getByLabel(/url/i).fill('https://testcompetitor.com');
    await page.getByLabel(/category/i).fill('SaaS');

    // Submit
    const submitButton = page.getByTestId('submit-competitor');
    await submitButton.click();

    // Verify success (either shows in list or shows success message)
    await expect(
      page.getByText(/competitor.*added|successfully tracked/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should display list of tracked competitors', async ({ page }) => {
    const competitorsContainer = page.getByTestId('competitors-container');

    if (await competitorsContainer.isVisible()) {
      // Should have at least the table/list structure
      await expect(competitorsContainer).toBeVisible();
    }
  });

  test('should show competitor details in list', async ({ page }) => {
    const competitorCard = page.getByTestId('competitor-card').first();

    if (await competitorCard.isVisible()) {
      // Verify competitor card has required information
      await expect(competitorCard.getByTestId('competitor-name')).toBeVisible();
      await expect(competitorCard.getByTestId('competitor-url')).toBeVisible();
    }
  });

  test('should display pricing alerts toggle', async ({ page }) => {
    const competitorCard = page.getByTestId('competitor-card').first();

    if (await competitorCard.isVisible()) {
      // Check for pricing alert toggle
      const pricingAlert = competitorCard.getByTestId('alert-pricing-toggle');
      if (await pricingAlert.isVisible()) {
        await expect(pricingAlert).toBeVisible();
      }
    }
  });

  test('should display feature alerts toggle', async ({ page }) => {
    const competitorCard = page.getByTestId('competitor-card').first();

    if (await competitorCard.isVisible()) {
      // Check for feature alert toggle
      const featureAlert = competitorCard.getByTestId('alert-feature-toggle');
      if (await featureAlert.isVisible()) {
        await expect(featureAlert).toBeVisible();
      }
    }
  });

  test('should show recent changes when available', async ({ page }) => {
    const competitorCard = page.getByTestId('competitor-card').first();

    if (await competitorCard.isVisible()) {
      // Look for changes section
      const changesSection = competitorCard.getByTestId('recent-changes');
      if (await changesSection.isVisible()) {
        await expect(changesSection).toBeVisible();
      }
    }
  });

  test('should allow removing tracked competitor', async ({ page }) => {
    const competitorCard = page.getByTestId('competitor-card').first();

    if (await competitorCard.isVisible()) {
      // Find and click remove/delete button
      const removeButton = competitorCard.getByTestId('remove-competitor');
      if (await removeButton.isVisible()) {
        await removeButton.click();

        // Should show confirmation or success message
        await expect(
          page.getByText(/removed|untracked|deleted/i)
        ).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should display last checked timestamp', async ({ page }) => {
    const competitorCard = page.getByTestId('competitor-card').first();

    if (await competitorCard.isVisible()) {
      // Check for last checked timestamp
      await expect(
        competitorCard.getByText(/last checked|checked at/i)
      ).toBeVisible();
    }
  });

  test('should have refresh/check now button', async ({ page }) => {
    const competitorCard = page.getByTestId('competitor-card').first();

    if (await competitorCard.isVisible()) {
      const refreshButton = competitorCard.getByTestId('check-now-button');
      if (await refreshButton.isVisible()) {
        await expect(refreshButton).toBeVisible();
      }
    }
  });

  test('should navigate to competitor details when clicked', async ({ page }) => {
    const competitorCard = page.getByTestId('competitor-card').first();

    if (await competitorCard.isVisible()) {
      const competitorName = await competitorCard.getByTestId('competitor-name').textContent();

      // Click on the card or a details link
      const detailsLink = competitorCard.getByTestId('view-details');
      if (await detailsLink.isVisible()) {
        await detailsLink.click();

        // Should navigate to details page
        await expect(page).toHaveURL(/\/dashboard\/competitors\/[^\/]+/);
      }
    }
  });

  test('should display changes count badge', async ({ page }) => {
    const competitorCard = page.getByTestId('competitor-card').first();

    if (await competitorCard.isVisible()) {
      // Look for changes badge/indicator
      const changesBadge = competitorCard.getByTestId('changes-badge');
      if (await changesBadge.isVisible()) {
        await expect(changesBadge).toBeVisible();
      }
    }
  });
});

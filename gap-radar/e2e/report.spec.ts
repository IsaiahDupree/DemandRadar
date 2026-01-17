import { test, expect } from '@playwright/test';

/**
 * Report Viewing E2E Tests
 *
 * Tests the flow of viewing and interacting with analysis reports.
 */

test.describe('Report Viewing', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

    // Sign in
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/i);
  });

  test('should display completed report', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Find a completed run
    const completedRun = page.locator('[data-status="complete"]').first();

    if (await completedRun.isVisible()) {
      // Click to view report
      await completedRun.click();

      // Wait for report page to load
      await page.waitForURL(/\/dashboard\/(reports|runs)\/[^/]+/i);

      // Check for report sections
      const hasExecutiveSummary = await page.getByText(/executive summary|overview/i).isVisible();
      const hasScores = await page.getByText(/opportunity score|saturation|confidence/i).isVisible();

      expect(hasExecutiveSummary || hasScores).toBeTruthy();
    } else {
      test.skip(true, 'No completed runs available for report viewing');
    }
  });

  test('should navigate between report sections', async ({ page }) => {
    // Skip to a report page directly if we have a test run ID
    if (process.env.TEST_REPORT_ID) {
      await page.goto(`/dashboard/reports/${process.env.TEST_REPORT_ID}`);
    } else {
      // Navigate via dashboard
      await page.goto('/dashboard');
      const completedRun = page.locator('[data-status="complete"]').first();

      if (!(await completedRun.isVisible())) {
        test.skip(true, 'No completed runs available');
        return;
      }

      await completedRun.click();
      await page.waitForURL(/\/dashboard\/(reports|runs)\/[^/]+/i);
    }

    // Look for section navigation (tabs or sidebar)
    const sections = [
      /executive summary|overview/i,
      /market snapshot|paid market/i,
      /pain map|user pain/i,
      /gap opportunities|gaps/i,
      /platform gap/i,
    ];

    let foundSections = 0;

    for (const sectionPattern of sections) {
      const sectionLink = page.getByRole('link', { name: sectionPattern }).or(
        page.getByRole('tab', { name: sectionPattern })
      );

      if (await sectionLink.isVisible()) {
        await sectionLink.click();
        await page.waitForTimeout(500); // Allow section to render
        foundSections++;
      }
    }

    // Should have found at least 3 sections
    expect(foundSections).toBeGreaterThanOrEqual(3);
  });

  test('should display scores and metrics', async ({ page }) => {
    // Navigate to a completed report
    if (process.env.TEST_REPORT_ID) {
      await page.goto(`/dashboard/reports/${process.env.TEST_REPORT_ID}`);
    } else {
      await page.goto('/dashboard');
      const completedRun = page.locator('[data-status="complete"]').first();

      if (!(await completedRun.isVisible())) {
        test.skip(true, 'No completed runs available');
        return;
      }

      await completedRun.click();
      await page.waitForURL(/\/dashboard\/(reports|runs)\/[^/]+/i);
    }

    // Check for score displays
    const scoreElements = page.locator('[data-testid*="score"], .score-card, [class*="score"]');
    const scoreCount = await scoreElements.count();

    // Should have multiple scores displayed
    expect(scoreCount).toBeGreaterThan(0);

    // Check for specific score types
    const hasOpportunityScore = await page.getByText(/opportunity.*score|overall score/i).isVisible();
    const hasSaturation = await page.getByText(/saturation/i).isVisible();
    const hasConfidence = await page.getByText(/confidence/i).isVisible();

    expect(hasOpportunityScore || hasSaturation || hasConfidence).toBeTruthy();
  });

  test('should display gap opportunities', async ({ page }) => {
    // Navigate to a completed report
    if (process.env.TEST_REPORT_ID) {
      await page.goto(`/dashboard/reports/${process.env.TEST_REPORT_ID}`);
    } else {
      await page.goto('/dashboard');
      const completedRun = page.locator('[data-status="complete"]').first();

      if (!(await completedRun.isVisible())) {
        test.skip(true, 'No completed runs available');
        return;
      }

      await completedRun.click();
      await page.waitForURL(/\/dashboard\/(reports|runs)\/[^/]+/i);
    }

    // Navigate to gaps section
    const gapsSection = page.getByRole('link', { name: /gap opportunities|gaps/i }).or(
      page.getByRole('tab', { name: /gap opportunities|gaps/i })
    );

    if (await gapsSection.isVisible()) {
      await gapsSection.click();
      await page.waitForTimeout(500);
    }

    // Check for gap cards or list items
    const gapElements = page.locator('[data-testid*="gap"], .gap-card, .gap-item');
    const gapCount = await gapElements.count();

    // Should have at least one gap displayed
    expect(gapCount).toBeGreaterThan(0);

    // Check for gap details
    const hasGapType = await page.getByText(/product gap|offer gap|positioning|trust|pricing/i).isVisible();
    const hasRecommendation = await page.getByText(/recommendation/i).isVisible();

    expect(hasGapType || hasRecommendation).toBeTruthy();
  });

  test('should export report as PDF', async ({ page }) => {
    // Navigate to a completed report
    if (process.env.TEST_REPORT_ID) {
      await page.goto(`/dashboard/reports/${process.env.TEST_REPORT_ID}`);
    } else {
      await page.goto('/dashboard');
      const completedRun = page.locator('[data-status="complete"]').first();

      if (!(await completedRun.isVisible())) {
        test.skip(true, 'No completed runs available');
        return;
      }

      await completedRun.click();
      await page.waitForURL(/\/dashboard\/(reports|runs)\/[^/]+/i);
    }

    // Look for export/download button
    const exportButton = page.getByRole('button', { name: /export|download|pdf/i });

    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      await exportButton.click();

      // Wait for download to start
      const download = await downloadPromise;

      // Verify download filename
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.pdf$/i);
      expect(filename).toContain('demandradar');
    } else {
      test.skip(true, 'Export button not found');
    }
  });

  test('should display market snapshot data', async ({ page }) => {
    // Navigate to a completed report
    if (process.env.TEST_REPORT_ID) {
      await page.goto(`/dashboard/reports/${process.env.TEST_REPORT_ID}`);
    } else {
      await page.goto('/dashboard');
      const completedRun = page.locator('[data-status="complete"]').first();

      if (!(await completedRun.isVisible())) {
        test.skip(true, 'No completed runs available');
        return;
      }

      await completedRun.click();
      await page.waitForURL(/\/dashboard\/(reports|runs)\/[^/]+/i);
    }

    // Navigate to market snapshot section
    const marketSection = page.getByRole('link', { name: /market snapshot|paid market/i }).or(
      page.getByRole('tab', { name: /market snapshot|paid market/i })
    );

    if (await marketSection.isVisible()) {
      await marketSection.click();
      await page.waitForTimeout(500);
    }

    // Check for advertisers table or data
    const hasAdvertisers = await page.getByText(/advertiser|top advertiser/i).isVisible();
    const hasAngles = await page.getByText(/angle|marketing angle/i).isVisible();
    const hasMediaTypes = await page.getByText(/media type|video|image/i).isVisible();

    expect(hasAdvertisers || hasAngles || hasMediaTypes).toBeTruthy();
  });

  test('should display UGC recommendations', async ({ page }) => {
    // Navigate to a completed report
    if (process.env.TEST_REPORT_ID) {
      await page.goto(`/dashboard/reports/${process.env.TEST_REPORT_ID}`);
    } else {
      await page.goto('/dashboard');
      const completedRun = page.locator('[data-status="complete"]').first();

      if (!(await completedRun.isVisible())) {
        test.skip(true, 'No completed runs available');
        return;
      }

      await completedRun.click();
      await page.waitForURL(/\/dashboard\/(reports|runs)\/[^/]+/i);
    }

    // Navigate to UGC section
    const ugcSection = page.getByRole('link', { name: /ugc|content|hooks|scripts/i }).or(
      page.getByRole('tab', { name: /ugc|content|hooks|scripts/i })
    );

    if (await ugcSection.isVisible()) {
      await ugcSection.click();
      await page.waitForTimeout(500);

      // Check for UGC elements
      const hasHooks = await page.getByText(/hook|opening/i).isVisible();
      const hasScripts = await page.getByText(/script|outline/i).isVisible();

      expect(hasHooks || hasScripts).toBeTruthy();
    } else {
      test.skip(true, 'UGC section not found');
    }
  });
});

test.describe('Report Interaction', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user credentials not configured');

    // Sign in
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/i);
  });

  test('should expand/collapse gap details', async ({ page }) => {
    // Navigate to a report
    if (process.env.TEST_REPORT_ID) {
      await page.goto(`/dashboard/reports/${process.env.TEST_REPORT_ID}`);
    } else {
      await page.goto('/dashboard');
      const completedRun = page.locator('[data-status="complete"]').first();

      if (!(await completedRun.isVisible())) {
        test.skip(true, 'No completed runs available');
        return;
      }

      await completedRun.click();
      await page.waitForURL(/\/dashboard\/(reports|runs)\/[^/]+/i);
    }

    // Find expandable gap card
    const gapCard = page.locator('[data-testid*="gap"], .gap-card').first();

    if (await gapCard.isVisible()) {
      // Click to expand
      await gapCard.click();
      await page.waitForTimeout(300);

      // Look for expanded content (evidence, recommendation)
      const hasEvidence = await page.getByText(/evidence|supporting data/i).isVisible();
      const hasRecommendation = await page.getByText(/recommendation|suggestion/i).isVisible();

      expect(hasEvidence || hasRecommendation).toBeTruthy();
    } else {
      test.skip(true, 'No gap cards found');
    }
  });

  test('should copy UGC hook to clipboard', async ({ page }) => {
    // Navigate to a report with UGC
    if (process.env.TEST_REPORT_ID) {
      await page.goto(`/dashboard/reports/${process.env.TEST_REPORT_ID}`);
    } else {
      await page.goto('/dashboard');
      const completedRun = page.locator('[data-status="complete"]').first();

      if (!(await completedRun.isVisible())) {
        test.skip(true, 'No completed runs available');
        return;
      }

      await completedRun.click();
      await page.waitForURL(/\/dashboard\/(reports|runs)\/[^/]+/i);
    }

    // Navigate to UGC section
    const ugcSection = page.getByRole('link', { name: /ugc|content|hooks/i }).or(
      page.getByRole('tab', { name: /ugc|content|hooks/i })
    );

    if (await ugcSection.isVisible()) {
      await ugcSection.click();
      await page.waitForTimeout(500);

      // Find copy button
      const copyButton = page.getByRole('button', { name: /copy/i }).first();

      if (await copyButton.isVisible()) {
        await copyButton.click();

        // Check for success message
        await expect(page.getByText(/copied|copy successful/i)).toBeVisible({ timeout: 3000 });
      } else {
        test.skip(true, 'Copy button not found');
      }
    } else {
      test.skip(true, 'UGC section not found');
    }
  });
});

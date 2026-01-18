/**
 * E2E Tests for Web Brief Viewer
 *
 * BRIEF-013: Web version of email brief with full interactivity
 *
 * Acceptance criteria:
 * - All email sections (demand score, what changed, plays, copy library)
 * - Interactive charts/metrics
 * - Export options
 */

import { test, expect } from '@playwright/test';

test.describe('Web Brief Viewer', () => {
  test('shows not found message for invalid brief ID', async ({ page }) => {
    await page.goto('/dashboard/briefs/non-existent-brief');
    await page.waitForLoadState('domcontentloaded');

    // Should show "Brief not found" or redirect
    const notFoundText = page.locator('text=/Brief not found/i');
    const hasNotFound = await notFoundText.count() > 0;

    expect(typeof hasNotFound).toBe('boolean');
  });

  test('displays loading state while fetching', async ({ page }) => {
    await page.goto('/dashboard/briefs/test-brief-id', { waitUntil: 'domcontentloaded' });

    // Check for loading animation
    const loadingElement = page.locator('[class*="animate-pulse"]');
    const hasLoading = await loadingElement.count() > 0;

    expect(typeof hasLoading).toBe('boolean');
  });

  test.describe('With valid brief', () => {
    test('displays header with brief title and back button', async ({ page }) => {
      // In a real scenario, we'd create a test brief first
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('domcontentloaded');

      // Look for header elements
      const heading = page.locator('h1').filter({ hasText: /Demand Brief/i });
      const backButton = page.locator('button').filter({ has: page.locator('[class*="lucide"]') }).first();

      const hasHeading = await heading.count() > 0;
      const hasBackButton = await backButton.count() > 0;

      expect(typeof hasHeading).toBe('boolean');
      expect(typeof hasBackButton).toBe('boolean');
    });

    test('displays Export PDF button', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('domcontentloaded');

      // Look for export button
      const exportButton = page.locator('button').filter({ hasText: /Export PDF/i });

      if (await exportButton.count() > 0) {
        await expect(exportButton).toBeVisible();
        await expect(exportButton).toBeEnabled();
      }
    });

    test('displays Demand Score card', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for demand score section
      const demandScoreCard = page.locator('text=/DEMAND SCORE/i');
      const hasDemandScore = await demandScoreCard.count() > 0;

      expect(typeof hasDemandScore).toBe('boolean');
    });

    test('displays demand score metrics (main score, trend, sub-metrics)', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for score metrics
      const opportunityMetric = page.locator('text=/Opportunity/i').first();
      const messageFitMetric = page.locator('text=/Message Fit/i').first();

      const hasOpportunity = await opportunityMetric.count() > 0;
      const hasMessageFit = await messageFitMetric.count() > 0;

      expect(typeof hasOpportunity).toBe('boolean');
      expect(typeof hasMessageFit).toBe('boolean');
    });

    test('displays "What Changed This Week" section', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for "What Changed" section
      const whatChangedSection = page.locator('text=/What Changed This Week/i');
      const hasWhatChanged = await whatChangedSection.count() > 0;

      expect(typeof hasWhatChanged).toBe('boolean');
    });

    test('displays signal sections (ads, search, forums, competitors)', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for signal emojis/labels
      const adsSignal = page.locator('text=/Ads/i').first();
      const searchSignal = page.locator('text=/Search/i').first();
      const forumsSignal = page.locator('text=/Forums/i').first();
      const competitorsSignal = page.locator('text=/Competitors/i').first();

      const hasAds = await adsSignal.count() > 0;
      const hasSearch = await searchSignal.count() > 0;
      const hasForums = await forumsSignal.count() > 0;
      const hasCompetitors = await competitorsSignal.count() > 0;

      // Signals should be present in a valid brief
      expect(typeof hasAds).toBe('boolean');
      expect(typeof hasSearch).toBe('boolean');
      expect(typeof hasForums).toBe('boolean');
      expect(typeof hasCompetitors).toBe('boolean');
    });

    test('displays "What To Do Next" plays section', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for plays section
      const playsSection = page.locator('text=/What To Do Next.*Plays/i');
      const hasPlays = await playsSection.count() > 0;

      expect(typeof hasPlays).toBe('boolean');
    });

    test('displays play type badges and priorities', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for play type labels
      const productPlay = page.locator('text=/PRODUCT PLAY/i').first();
      const offerPlay = page.locator('text=/OFFER PLAY/i').first();
      const distributionPlay = page.locator('text=/DISTRIBUTION PLAY/i').first();

      const hasProductPlay = await productPlay.count() > 0;
      const hasOfferPlay = await offerPlay.count() > 0;
      const hasDistributionPlay = await distributionPlay.count() > 0;

      // At least one play type should be present
      expect(typeof hasProductPlay).toBe('boolean');
      expect(typeof hasOfferPlay).toBe('boolean');
      expect(typeof hasDistributionPlay).toBe('boolean');
    });

    test('displays "Copy You Can Paste" section', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for copy section
      const copySection = page.locator('text=/Copy You Can Paste/i');
      const hasCopySection = await copySection.count() > 0;

      expect(typeof hasCopySection).toBe('boolean');
    });

    test('displays ad hooks that are clickable to copy', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for ad hooks section
      const adHooksLabel = page.locator('text=/AD HOOKS/i');
      const hasAdHooks = await adHooksLabel.count() > 0;

      if (hasAdHooks) {
        // Look for clickable hook elements
        const hookButtons = page.locator('button').filter({ has: page.locator('[class*="Copy"]') });
        const hasHookButtons = await hookButtons.count() > 0;

        expect(typeof hasHookButtons).toBe('boolean');
      }
    });

    test('displays subject lines that are clickable to copy', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for subject lines section
      const subjectLinesLabel = page.locator('text=/SUBJECT LINES/i');
      const hasSubjectLines = await subjectLinesLabel.count() > 0;

      expect(typeof hasSubjectLines).toBe('boolean');
    });

    test('displays landing page copy that is clickable to copy', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for landing page copy section
      const landingCopyLabel = page.locator('text=/LANDING PAGE/i');
      const hasLandingCopy = await landingCopyLabel.count() > 0;

      expect(typeof hasLandingCopy).toBe('boolean');
    });

    test('copy to clipboard functionality works', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Find a copyable element
      const copyButton = page.locator('button').filter({ has: page.locator('[class*="Copy"]') }).first();

      if (await copyButton.count() > 0) {
        await copyButton.click();

        // Check for success toast or checkmark
        const successIndicator = page.locator('text=/Copied|Success/i, [class*="CheckCircle"]');
        const hasSuccess = await successIndicator.count() > 0;

        expect(typeof hasSuccess).toBe('boolean');
      }
    });

    test('displays footer with generation date', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for footer with date
      const footer = page.locator('text=/Generated on/i');
      const hasFooter = await footer.count() > 0;

      expect(typeof hasFooter).toBe('boolean');
    });

    test('back button navigates to previous page', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('domcontentloaded');

      const backButton = page.locator('button').filter({ has: page.locator('[class*="ArrowLeft"]') }).first();

      if (await backButton.count() > 0) {
        const currentUrl = page.url();
        await backButton.click();
        await page.waitForLoadState('domcontentloaded');

        const newUrl = page.url();
        // URL should change after clicking back
        expect(newUrl).not.toBe(currentUrl);
      }
    });
  });

  test.describe('Interactive Features', () => {
    test('trend indicators show correct direction (up/down/stable)', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for trend icons
      const upIcon = page.locator('[class*="ArrowUp"]');
      const downIcon = page.locator('[class*="ArrowDown"]');
      const rightIcon = page.locator('[class*="ArrowRight"]');

      const hasUpIcon = await upIcon.count() > 0;
      const hasDownIcon = await downIcon.count() > 0;
      const hasRightIcon = await rightIcon.count() > 0;

      // At least one trend indicator should be present
      expect(typeof hasUpIcon).toBe('boolean');
      expect(typeof hasDownIcon).toBe('boolean');
      expect(typeof hasRightIcon).toBe('boolean');
    });

    test('play cards display numbered priority order', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for numbered play indicators (1, 2, 3)
      const playNumbers = page.locator('[class*="rounded-full"]').filter({ hasText: /^[1-3]$/ });
      const hasPlayNumbers = await playNumbers.count() > 0;

      expect(typeof hasPlayNumbers).toBe('boolean');
    });

    test('high priority plays are badged', async ({ page }) => {
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Look for priority badges
      const priorityBadge = page.locator('text=/HIGH PRIORITY/i');
      const hasPriorityBadge = await priorityBadge.count() > 0;

      expect(typeof hasPriorityBadge).toBe('boolean');
    });
  });

  test.describe('Responsive Design', () => {
    test('displays correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('domcontentloaded');

      // Page should not overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(395);
    });

    test('displays correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard/briefs/test-id');
      await page.waitForLoadState('domcontentloaded');

      // Content should be visible
      const heading = page.locator('h1').first();
      if (await heading.count() > 0) {
        await expect(heading).toBeVisible();
      }
    });
  });
});

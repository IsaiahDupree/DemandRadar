import { test, expect } from '@playwright/test';

test.describe('Dashboard Layout (DASH-001)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should render sidebar with navigation items', async ({ page }) => {
    // Check if sidebar is visible
    const sidebar = page.getByRole('complementary');
    await expect(sidebar).toBeVisible();

    // Check for GapRadar branding
    await expect(page.getByText('GapRadar')).toBeVisible();
    await expect(page.getByText('Market Gap Analysis')).toBeVisible();

    // Check for main navigation items
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /My Niches/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /New Analysis/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Runs/i })).toBeVisible();

    // Check for analysis navigation items
    await expect(page.getByRole('link', { name: /Gap Opportunities/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Product Ideas/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /UGC Winners/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Market Trends/i })).toBeVisible();

    // Check for settings navigation items
    await expect(page.getByRole('link', { name: /^Reports$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Settings$/i })).toBeVisible();
  });

  test('should show user menu in sidebar footer', async ({ page }) => {
    // Check for user menu trigger
    const userMenu = page.getByRole('button', { name: /Isaiah Dupree/i });
    await expect(userMenu).toBeVisible();

    // Click to open menu
    await userMenu.click();

    // Check menu items
    await expect(page.getByRole('menuitem', { name: /Account/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Billing/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Sign out/i })).toBeVisible();
  });

  test('should have responsive layout with header', async ({ page }) => {
    // Check for header
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Check for sidebar trigger button (for mobile)
    const sidebarTrigger = page.getByRole('button', { name: /Toggle Sidebar/i }).or(
      page.locator('button[aria-label*="sidebar"]').or(
        page.locator('[data-sidebar-trigger]')
      )
    );
    await expect(sidebarTrigger.first()).toBeVisible();

    // Check for breadcrumb
    await expect(page.getByText('GapRadar')).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    // Click on "New Analysis" link
    await page.getByRole('link', { name: /New Analysis/i }).click();

    // Check URL changed
    await expect(page).toHaveURL(/\/dashboard\/new-run/);

    // Click on "Runs" link
    await page.getByRole('link', { name: /Runs/i }).click();

    // Check URL changed
    await expect(page).toHaveURL(/\/dashboard\/runs/);

    // Click on "Dashboard" link to go back
    await page.getByRole('link', { name: /^Dashboard$/i }).first().click();

    // Check URL is back to dashboard
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Navigate to runs page
    await page.goto('/dashboard/runs');

    // The "Runs" link should have active state
    // Check if the link has data-active or aria-current attribute
    const runsLink = page.getByRole('link', { name: /^Runs$/i });

    // In shadcn sidebar, active items typically have data-active="true"
    await expect(runsLink).toHaveAttribute('data-active', 'true');
  });

  test('should have accessible sidebar toggle on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Sidebar trigger should be visible
    const trigger = page.locator('[data-sidebar="trigger"]').or(
      page.getByRole('button').filter({ has: page.locator('svg') }).first()
    );

    await expect(trigger.first()).toBeVisible();
  });
});

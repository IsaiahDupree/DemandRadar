import { test, expect } from '@playwright/test';

/**
 * Landing Page E2E Tests
 * Based on PRD acceptance criteria
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with value prop', async ({ page }) => {
    // Hero section visible
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
    
    // Headline present
    const headline = page.locator('h1');
    await expect(headline).toBeVisible();
    
    // CTA buttons visible
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('NLP search input accepts text and shows suggestions', async ({ page }) => {
    const searchInput = page.locator('[data-testid="nlp-search-input"]');
    await expect(searchInput).toBeVisible();
    
    // Type a niche query
    await searchInput.fill('AI tools for content creators');
    
    // Suggestions should appear within 300ms
    const suggestions = page.locator('[data-testid="nlp-suggestions"]');
    await expect(suggestions).toBeVisible({ timeout: 500 });
    
    // Should show category inference
    await expect(page.locator('[data-testid="suggestion-category"]')).toBeVisible();
    
    // Should show confidence indicator
    await expect(page.locator('[data-testid="suggestion-confidence"]')).toBeVisible();
  });

  test('NLP suggestions are keyboard navigable', async ({ page }) => {
    const searchInput = page.locator('[data-testid="nlp-search-input"]');
    await searchInput.fill('marketing automation');
    
    // Wait for suggestions
    await page.waitForSelector('[data-testid="nlp-suggestions"]');
    
    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    const firstSuggestion = page.locator('[data-testid="suggestion-item"]').first();
    await expect(firstSuggestion).toHaveAttribute('data-focused', 'true');
    
    // Select with Enter
    await page.keyboard.press('Enter');
    
    // Input should be updated
    await expect(searchInput).not.toHaveValue('marketing automation');
  });

  test('trending topics grid displays 9-12 cards', async ({ page }) => {
    const trendingSection = page.locator('[data-testid="trending-topics"]');
    await expect(trendingSection).toBeVisible();
    
    const trendCards = page.locator('[data-testid="trend-card"]');
    const count = await trendCards.count();
    
    expect(count).toBeGreaterThanOrEqual(9);
    expect(count).toBeLessThanOrEqual(12);
  });

  test('trend cards show required fields', async ({ page }) => {
    const firstCard = page.locator('[data-testid="trend-card"]').first();
    await expect(firstCard).toBeVisible();
    
    // Topic title
    await expect(firstCard.locator('[data-testid="trend-topic"]')).toBeVisible();
    
    // Category
    await expect(firstCard.locator('[data-testid="trend-category"]')).toBeVisible();
    
    // Opportunity score
    await expect(firstCard.locator('[data-testid="trend-opportunity-score"]')).toBeVisible();
    
    // Growth indicator
    await expect(firstCard.locator('[data-testid="trend-growth"]')).toBeVisible();
    
    // Sentiment
    await expect(firstCard.locator('[data-testid="trend-sentiment"]')).toBeVisible();
    
    // Sources
    await expect(firstCard.locator('[data-testid="trend-sources"]')).toBeVisible();
  });

  test('clicking trend card prefills search input', async ({ page }) => {
    const searchInput = page.locator('[data-testid="nlp-search-input"]');
    const firstCard = page.locator('[data-testid="trend-card"]').first();
    
    // Get the topic text
    const topicText = await firstCard.locator('[data-testid="trend-topic"]').textContent();
    
    // Click the card
    await firstCard.click();
    
    // Search input should be prefilled
    await expect(searchInput).toHaveValue(topicText || '');
    
    // Input should be focused
    await expect(searchInput).toBeFocused();
  });

  test('displays updated at timestamp', async ({ page }) => {
    const timestamp = page.locator('[data-testid="trends-updated-at"]');
    await expect(timestamp).toBeVisible();
    
    // Should contain a date/time
    const text = await timestamp.textContent();
    expect(text).toMatch(/updated|ago|:\d{2}/i);
  });

  test('features section renders', async ({ page }) => {
    const featuresSection = page.locator('[data-testid="features-section"]');
    await expect(featuresSection).toBeVisible();
    
    // Should have multiple feature items
    const featureItems = page.locator('[data-testid="feature-item"]');
    await expect(featureItems.first()).toBeVisible();
  });

  test('CTA footer renders with signup link', async ({ page }) => {
    const ctaFooter = page.locator('[data-testid="cta-footer"]');
    await expect(ctaFooter).toBeVisible();
    
    // Should have a CTA button
    await expect(ctaFooter.getByRole('button')).toBeVisible();
  });

  test('search submit routes to signup when not authenticated', async ({ page }) => {
    const searchInput = page.locator('[data-testid="nlp-search-input"]');
    await searchInput.fill('productivity tools for remote teams');
    
    // Submit the form
    await page.keyboard.press('Enter');
    
    // Should redirect to signup/login
    await expect(page).toHaveURL(/\/(signup|login|auth)/);
    
    // Query should be preserved
    const url = page.url();
    expect(url).toContain('productivity');
  });
});

test.describe('Landing Page SEO', () => {
  test('has proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    
    // Description
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description?.length).toBeGreaterThan(50);
    
    // OG tags
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /.+/);
    
    // Twitter cards
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', /.+/);
  });

  test('has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have exactly one H1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Should have H2s
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0);
  });
});

test.describe('Landing Page Accessibility', () => {
  test('interactive elements have visible focus states', async ({ page }) => {
    await page.goto('/');
    
    // Tab through elements and check focus visibility
    const searchInput = page.locator('[data-testid="nlp-search-input"]');
    await searchInput.focus();
    
    // Check focus is visible (outline or ring)
    const focusStyle = await searchInput.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    expect(focusStyle).toBe(true);
  });

  test('trend cards are accessible', async ({ page }) => {
    await page.goto('/');
    
    const firstCard = page.locator('[data-testid="trend-card"]').first();
    
    // Should be focusable (button or link semantics)
    const role = await firstCard.getAttribute('role');
    const tagName = await firstCard.evaluate((el) => el.tagName.toLowerCase());
    
    expect(role === 'button' || role === 'link' || tagName === 'button' || tagName === 'a').toBe(true);
  });
});

test.describe('Landing Page Performance', () => {
  test('trends load within 1 second when cached', async ({ page }) => {
    // First load to warm cache
    await page.goto('/');
    await page.waitForSelector('[data-testid="trend-card"]');
    
    // Second load should be fast
    const startTime = Date.now();
    await page.reload();
    await page.waitForSelector('[data-testid="trend-card"]');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(1500); // 1.5s with some buffer
  });
});

import { test, expect } from '@playwright/test';

/**
 * SEO E2E Tests
 *
 * Tests OpenGraph, Twitter Cards, and other SEO metadata
 */

test.describe('SEO Metadata', () => {
  test('landing page should have OpenGraph metadata', async ({ page }) => {
    await page.goto('/');

    // Check OpenGraph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    const ogSiteName = await page.locator('meta[property="og:site_name"]').getAttribute('content');

    expect(ogTitle).toBeTruthy();
    expect(ogTitle).toMatch(/DemandRadar|GapRadar/);
    expect(ogDescription).toBeTruthy();
    expect(ogDescription?.length).toBeGreaterThan(50);
    expect(ogImage).toBeTruthy();
    expect(ogImage).toMatch(/opengraph-image|og-image/);
    expect(ogType).toBe('website');
    expect(ogSiteName).toBeTruthy();
  });

  test('landing page should have Twitter Card metadata', async ({ page }) => {
    await page.goto('/');

    // Check Twitter Card tags
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content');
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content');
    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');

    expect(twitterCard).toBe('summary_large_image');
    expect(twitterTitle).toBeTruthy();
    expect(twitterTitle).toMatch(/DemandRadar|GapRadar/);
    expect(twitterDescription).toBeTruthy();
    expect(twitterDescription?.length).toBeGreaterThan(50);
    expect(twitterImage).toBeTruthy();
    expect(twitterImage).toMatch(/twitter-image|opengraph-image|og-image/);
  });

  test('landing page should have basic meta tags', async ({ page }) => {
    await page.goto('/');

    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).toMatch(/DemandRadar|GapRadar/);

    // Check description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description?.length).toBeGreaterThan(50);
  });

  test('OG image should be accessible', async ({ page, request }) => {
    await page.goto('/');

    // Get the OG image URL
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();

    // Try to fetch the image
    const imageUrl = ogImage?.startsWith('http')
      ? ogImage
      : `${page.url()}${ogImage?.replace(/^\//, '')}`;

    const response = await request.get(imageUrl);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image');
  });

  test('should have correct viewport and charset', async ({ page }) => {
    await page.goto('/');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });
});

test.describe('Structured Data (JSON-LD)', () => {
  test('landing page should have Product schema', async ({ page }) => {
    await page.goto('/');

    // Find all JSON-LD scripts
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();
    expect(jsonLdScripts.length).toBeGreaterThan(0);

    // Extract and parse JSON-LD content
    let productSchema = null;
    for (const script of jsonLdScripts) {
      const content = await script.textContent();
      if (content) {
        const data = JSON.parse(content);
        if (data['@type'] === 'Product' || data['@type'] === 'SoftwareApplication') {
          productSchema = data;
          break;
        }
      }
    }

    expect(productSchema).toBeTruthy();
    expect(productSchema['@context']).toBe('https://schema.org');
    expect(productSchema['@type']).toMatch(/Product|SoftwareApplication/);
    expect(productSchema.name).toBeTruthy();
    expect(productSchema.description).toBeTruthy();
    expect(productSchema.offers).toBeTruthy();
    expect(productSchema.aggregateRating || productSchema.review).toBeTruthy();
  });

  test('landing page should have Organization schema', async ({ page }) => {
    await page.goto('/');

    // Find all JSON-LD scripts
    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();

    // Extract and parse JSON-LD content
    let orgSchema = null;
    for (const script of jsonLdScripts) {
      const content = await script.textContent();
      if (content) {
        const data = JSON.parse(content);
        if (data['@type'] === 'Organization') {
          orgSchema = data;
          break;
        }
      }
    }

    expect(orgSchema).toBeTruthy();
    expect(orgSchema['@context']).toBe('https://schema.org');
    expect(orgSchema['@type']).toBe('Organization');
    expect(orgSchema.name).toBeTruthy();
    expect(orgSchema.url).toBeTruthy();
    expect(orgSchema.logo).toBeTruthy();
    expect(orgSchema.sameAs).toBeTruthy();
  });

  test('JSON-LD schemas should be valid JSON', async ({ page }) => {
    await page.goto('/');

    const jsonLdScripts = await page.locator('script[type="application/ld+json"]').all();

    for (const script of jsonLdScripts) {
      const content = await script.textContent();
      expect(content).toBeTruthy();

      // Should not throw when parsing
      expect(() => JSON.parse(content!)).not.toThrow();
    }
  });
});

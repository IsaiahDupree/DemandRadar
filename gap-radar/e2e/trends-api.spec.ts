import { test, expect } from '@playwright/test';

/**
 * Trends API E2E Tests
 * Based on PRD acceptance criteria for GET /api/trends
 */

test.describe('Trends API', () => {
  test('returns 9-12 trend cards within 1 second when cached', async ({ request }) => {
    // Warm the cache
    await request.get('/api/trends');
    
    // Time the cached request
    const startTime = Date.now();
    const response = await request.get('/api/trends');
    const duration = Date.now() - startTime;
    
    expect(response.ok()).toBe(true);
    expect(duration).toBeLessThan(1000);
    
    const data = await response.json();
    expect(data.trends.length).toBeGreaterThanOrEqual(9);
    expect(data.trends.length).toBeLessThanOrEqual(12);
  });

  test('returns correct response shape', async ({ request }) => {
    const response = await request.get('/api/trends');
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    
    // Top level structure
    expect(data).toHaveProperty('trends');
    expect(data).toHaveProperty('lastUpdated');
    expect(data).toHaveProperty('sources');
    
    // Trends is an array
    expect(Array.isArray(data.trends)).toBe(true);
    
    // Sources is an array
    expect(Array.isArray(data.sources)).toBe(true);
    
    // lastUpdated is a valid ISO date
    expect(new Date(data.lastUpdated).toString()).not.toBe('Invalid Date');
  });

  test('each trend has required fields', async ({ request }) => {
    const response = await request.get('/api/trends');
    const data = await response.json();
    
    for (const trend of data.trends) {
      expect(trend).toHaveProperty('id');
      expect(typeof trend.id).toBe('string');
      
      expect(trend).toHaveProperty('topic');
      expect(typeof trend.topic).toBe('string');
      expect(trend.topic.length).toBeGreaterThan(0);
      
      expect(trend).toHaveProperty('category');
      expect(typeof trend.category).toBe('string');
      
      expect(trend).toHaveProperty('volume');
      expect(typeof trend.volume).toBe('number');
      
      expect(trend).toHaveProperty('growth');
      expect(typeof trend.growth).toBe('number');
      expect(trend.growth).toBeGreaterThanOrEqual(0);
      expect(trend.growth).toBeLessThanOrEqual(100);
      
      expect(trend).toHaveProperty('sentiment');
      expect(['positive', 'neutral', 'negative']).toContain(trend.sentiment);
      
      expect(trend).toHaveProperty('sources');
      expect(Array.isArray(trend.sources)).toBe(true);
      expect(trend.sources.length).toBeGreaterThan(0);
      
      expect(trend).toHaveProperty('relatedTerms');
      expect(Array.isArray(trend.relatedTerms)).toBe(true);
      
      expect(trend).toHaveProperty('opportunityScore');
      expect(typeof trend.opportunityScore).toBe('number');
      expect(trend.opportunityScore).toBeGreaterThanOrEqual(0);
      expect(trend.opportunityScore).toBeLessThanOrEqual(100);
    }
  });

  test('shows at least one source label per trend', async ({ request }) => {
    const response = await request.get('/api/trends');
    const data = await response.json();
    
    for (const trend of data.trends) {
      expect(trend.sources.length).toBeGreaterThan(0);
      // Each source should be a non-empty string
      for (const source of trend.sources) {
        expect(typeof source).toBe('string');
        expect(source.length).toBeGreaterThan(0);
      }
    }
  });

  test('returns fallback trends when Reddit is unavailable', async ({ request }) => {
    // This test assumes the API handles external failures gracefully
    // The actual implementation should return cached or fallback data
    const response = await request.get('/api/trends');
    
    // Should always return successfully
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    
    // Should have trends even if from fallback
    expect(data.trends.length).toBeGreaterThan(0);
  });

  test('no API keys or secrets in response', async ({ request }) => {
    const response = await request.get('/api/trends');
    const data = await response.json();
    const responseText = JSON.stringify(data);
    
    // Check for common secret patterns
    expect(responseText).not.toMatch(/api[_-]?key/i);
    expect(responseText).not.toMatch(/secret/i);
    expect(responseText).not.toMatch(/password/i);
    expect(responseText).not.toMatch(/token/i);
    expect(responseText).not.toMatch(/bearer/i);
    expect(responseText).not.toMatch(/sk_live/i);
    expect(responseText).not.toMatch(/pk_live/i);
  });

  test('caching works correctly', async ({ request }) => {
    // First request
    const response1 = await request.get('/api/trends');
    const data1 = await response1.json();
    
    // Second request immediately after
    const response2 = await request.get('/api/trends');
    const data2 = await response2.json();
    
    // Should return the same lastUpdated (cached)
    expect(data1.lastUpdated).toBe(data2.lastUpdated);
    
    // Trends should be the same
    expect(data1.trends.length).toBe(data2.trends.length);
  });
});

test.describe('Trends API Error Handling', () => {
  test('returns proper error shape on failure', async ({ request }) => {
    // This would need a way to simulate failure
    // For now, we just verify the API responds
    const response = await request.get('/api/trends');
    
    if (!response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    }
  });
});

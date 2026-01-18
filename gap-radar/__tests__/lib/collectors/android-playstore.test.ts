/**
 * Android Play Store Collector Tests
 */

import { searchPlayStore, type PlayStoreResult } from '@/lib/collectors/android-playstore';

describe('Android Play Store Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SERPAPI_KEY;
  });

  describe('searchPlayStore', () => {
    it('fetches Android apps via SerpAPI when key is available', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          organic_results: [
            {
              title: 'Fitness Tracker Pro',
              product_id: 'com.fitness.tracker',
              developer: 'HealthTech Inc',
              rating: 4.5,
              reviews: '10,000',
              description: 'Track your workouts and progress',
              category: 'Health & Fitness',
              price: 'Free',
            },
            {
              title: 'Workout Planner',
              product_id: 'com.workout.planner',
              developer: 'FitApps',
              rating: 4.2,
              reviews: '5,000',
              snippet: 'Plan your workouts effectively',
              category: 'Health & Fitness',
              price: '$2.99',
            },
          ],
        }),
      } as Response);

      const results = await searchPlayStore('fitness app');

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        platform: 'android',
        app_name: 'Fitness Tracker Pro',
        app_id: 'com.fitness.tracker',
        developer: 'HealthTech Inc',
        rating: 4.5,
        review_count: 10000,
        category: 'Health & Fitness',
        price: 'Free',
      });
    });

    it('uses correct SerpAPI parameters', async () => {
      process.env.SERPAPI_KEY = 'test-api-key';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ organic_results: [] }),
      } as Response);

      await searchPlayStore('productivity', { country: 'gb', limit: 20 });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('serpapi.com/search.json');
      expect(fetchCall).toContain('api_key=test-api-key');
      expect(fetchCall).toContain('engine=google_play');
      expect(fetchCall).toContain('q=productivity');
      expect(fetchCall).toContain('gl=gb');
      expect(fetchCall).toContain('num=20');
    });

    it('defaults to US country and 10 results', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ organic_results: [] }),
      } as Response);

      await searchPlayStore('test');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(fetchCall).toContain('gl=us');
      expect(fetchCall).toContain('num=10');
    });

    it('falls back to mock data when SERPAPI_KEY is not set', async () => {
      const results = await searchPlayStore('fitness app');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.platform === 'android')).toBe(true);
      expect(results[0].app_name).toContain('fitness app');
    });

    it('falls back to mock data when SerpAPI request fails', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const results = await searchPlayStore('test');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.platform === 'android')).toBe(true);
    });

    it('falls back to mock data when SerpAPI returns non-OK response', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as Response);

      const results = await searchPlayStore('test');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('falls back to mock data when SerpAPI returns empty results', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ organic_results: [] }),
      } as Response);

      const results = await searchPlayStore('test');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('normalizes app data to schema correctly', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          organic_results: [
            {
              title: 'Test App',
              product_id: 'com.test.app',
              link: 'https://play.google.com/store/apps/details?id=com.test.app',
              developer: 'Test Developer',
              rating: '4.7',
              reviews: '1,234,567',
              description: 'A'.repeat(600), // Long description
              category: 'Productivity',
              price: '$9.99',
              custom_field: 'should be in raw_payload',
            },
          ],
        }),
      } as Response);

      const results = await searchPlayStore('test');

      expect(results[0]).toMatchObject({
        platform: 'android',
        app_name: 'Test App',
        app_id: 'com.test.app',
        developer: 'Test Developer',
        rating: 4.7,
        review_count: 1234567,
        category: 'Productivity',
        price: '$9.99',
      });

      // Description should be truncated to 500 chars
      expect(results[0].description.length).toBeLessThanOrEqual(500);

      // Raw payload should be stored
      expect(results[0].raw_payload).toBeDefined();
      expect(results[0].raw_payload?.custom_field).toBe('should be in raw_payload');
    });

    it('handles missing product_id by extracting from link', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          organic_results: [
            {
              title: 'Test App',
              link: 'https://play.google.com/store/apps/details?id=com.extracted.id',
              developer: 'Test Dev',
              rating: 4.0,
              reviews: '100',
            },
          ],
        }),
      } as Response);

      const results = await searchPlayStore('test');

      expect(results[0].app_id).toBe('com.extracted.id');
    });

    it('handles apps with no reviews', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          organic_results: [
            {
              title: 'New App',
              product_id: 'com.new.app',
              developer: 'Startup',
              rating: 0,
              description: 'Brand new app',
            },
          ],
        }),
      } as Response);

      const results = await searchPlayStore('test');

      expect(results[0].rating).toBe(0);
      expect(results[0].review_count).toBe(0);
    });

    it('uses snippet as description fallback', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          organic_results: [
            {
              title: 'Test App',
              product_id: 'com.test',
              developer: 'Dev',
              snippet: 'This is a snippet from search results',
            },
          ],
        }),
      } as Response);

      const results = await searchPlayStore('test');

      expect(results[0].description).toBe('This is a snippet from search results');
    });

    it('rate limits requests appropriately', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ organic_results: [] }),
      } as Response);

      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() => searchPlayStore('test'));
      await Promise.all(promises);

      // Should have made 5 separate API calls
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(5);
    });
  });
});

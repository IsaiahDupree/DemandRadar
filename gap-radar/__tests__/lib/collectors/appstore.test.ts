/**
 * App Store Collector Tests
 */

import { collectAppStoreResults } from '@/lib/collectors/appstore';

describe('App Store Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SERPAPI_KEY;
  });

  describe('collectAppStoreResults', () => {
    it('returns array of apps from all platforms', async () => {
      // Mock iTunes API for iOS
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            results: [
              {
                trackId: 123456,
                trackName: 'Test iOS App',
                artistName: 'Test Developer',
                averageUserRating: 4.5,
                userRatingCount: 1000,
                description: 'Test description',
                primaryGenreName: 'Productivity',
                formattedPrice: 'Free',
              },
            ],
          }),
        } as Response)
        // Mock for seed term search
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            results: [],
          }),
        } as Response)
        // Mock for seed term search
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            results: [],
          }),
        } as Response);

      const apps = await collectAppStoreResults('fitness app', ['workout', 'exercise']);

      expect(Array.isArray(apps)).toBe(true);
      expect(apps.length).toBeGreaterThan(0);
      expect(apps.some(a => a.platform === 'ios')).toBe(true);
      expect(apps.some(a => a.platform === 'android')).toBe(true);
      expect(apps.some(a => a.platform === 'web')).toBe(true);
    });

    it('collects iOS apps from iTunes API', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: [
              {
                trackId: 123,
                trackName: 'Test App',
                artistName: 'Test Developer',
                averageUserRating: 4.5,
                userRatingCount: 100,
                description: 'Test description',
                primaryGenreName: 'Tools',
                formattedPrice: '$1.99',
              },
            ],
          }),
        } as Response)
      );

      const apps = await collectAppStoreResults('test', []);
      const iosApps = apps.filter(a => a.platform === 'ios');

      expect(iosApps.length).toBeGreaterThan(0);
      expect(iosApps[0]).toMatchObject({
        platform: 'ios',
        app_name: 'Test App',
        app_id: '123',
        developer: 'Test Developer',
        rating: 4.5,
        review_count: 100,
        category: 'Tools',
        price: '$1.99',
      });
    });

    it('collects Android apps from SerpAPI when key is available', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn()
        // iOS calls
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        } as Response)
        // Android SerpAPI call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            organic_results: [
              {
                title: 'Test Android App',
                product_id: 'com.test.app',
                developer: 'Test Dev',
                rating: 4.2,
                reviews: '5,000',
                description: 'Android app description',
                category: 'Tools',
                price: 'Free',
              },
            ],
          }),
        } as Response);

      const apps = await collectAppStoreResults('test', []);
      const androidApps = apps.filter(a => a.platform === 'android');

      expect(androidApps.length).toBeGreaterThan(0);
      expect(androidApps[0]).toMatchObject({
        platform: 'android',
        app_name: 'Test Android App',
        app_id: 'com.test.app',
        developer: 'Test Dev',
        rating: 4.2,
        review_count: 5000,
      });
    });

    it('uses mock Android data when no SerpAPI key', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        } as Response)
      );

      const apps = await collectAppStoreResults('test', []);
      const androidApps = apps.filter(a => a.platform === 'android');

      // Should have mock Android data
      expect(androidApps.length).toBeGreaterThan(0);
    });

    it('includes web competitors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        } as Response)
      );

      const apps = await collectAppStoreResults('test', []);
      const webApps = apps.filter(a => a.platform === 'web');

      expect(webApps.length).toBeGreaterThan(0);
      expect(webApps[0]).toHaveProperty('platform', 'web');
    });

    it('deduplicates by platform and app_id', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            results: [
              {
                trackId: 123,
                trackName: 'Duplicate App',
                artistName: 'Dev',
                averageUserRating: 4.0,
                userRatingCount: 100,
                description: 'Test',
                primaryGenreName: 'Tools',
                formattedPrice: 'Free',
              },
              {
                trackId: 123, // Same ID
                trackName: 'Duplicate App Again',
                artistName: 'Dev',
                averageUserRating: 4.0,
                userRatingCount: 100,
                description: 'Test',
                primaryGenreName: 'Tools',
                formattedPrice: 'Free',
              },
            ],
          }),
        } as Response)
      );

      const apps = await collectAppStoreResults('test', []);
      const iosApps = apps.filter(a => a.platform === 'ios');

      // Should deduplicate same app_id
      const uniqueIds = new Set(iosApps.map(a => a.app_id));
      expect(iosApps.length).toBe(uniqueIds.size);
    });

    it('handles iTunes API errors gracefully', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const apps = await collectAppStoreResults('test', []);

      // Should still return mock data for Android and Web
      expect(Array.isArray(apps)).toBe(true);
      expect(apps.length).toBeGreaterThan(0);
    });

    it('handles iTunes API non-OK responses', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      );

      const apps = await collectAppStoreResults('test', []);

      // Should still return results from other sources
      expect(Array.isArray(apps)).toBe(true);
    });

    it('handles SerpAPI errors gracefully', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn()
        // iOS call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        } as Response)
        // Android SerpAPI fails
        .mockRejectedValueOnce(new Error('SerpAPI error'));

      const apps = await collectAppStoreResults('test', []);
      const androidApps = apps.filter(a => a.platform === 'android');

      // Should fall back to mock Android data
      expect(androidApps.length).toBeGreaterThan(0);
    });

    it('handles empty SerpAPI results', async () => {
      process.env.SERPAPI_KEY = 'test-key';

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ organic_results: [] }),
        } as Response);

      const apps = await collectAppStoreResults('test', []);
      const androidApps = apps.filter(a => a.platform === 'android');

      // Should fall back to mock data when no results
      expect(androidApps.length).toBeGreaterThan(0);
    });

    it('limits search terms processed', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        } as Response)
      );

      const manySeeds = Array(10).fill('term');
      await collectAppStoreResults('test', manySeeds);

      // Should limit to niche query + 2 seed terms = 3 iOS searches
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      const itunesCalls = fetchCalls.filter(call =>
        call[0].includes('itunes.apple.com')
      );

      expect(itunesCalls.length).toBe(3); // nicheQuery + 2 seed terms
    });
  });
});

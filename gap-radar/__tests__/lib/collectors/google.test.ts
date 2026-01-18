/**
 * Google Ads Collector Tests
 */

import { collectGoogleAds, searchGoogleAds } from '@/lib/collectors/google';

describe('Google Ads Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collectGoogleAds', () => {
    it('returns array of Google ads', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ads: [
              {
                title: 'Best Fitness App',
                description: 'Get fit with our app',
                advertiser: 'FitnessPro',
                displayed_link: 'www.fitnesspro.com',
                link: 'https://fitnesspro.com',
                position: 1,
              },
            ],
          }),
        } as Response)
      );

      const ads = await collectGoogleAds('fitness app', ['workout']);

      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBeGreaterThan(0);
      expect(ads[0]).toHaveProperty('source', 'google');
      expect(ads[0]).toHaveProperty('advertiser_name');
      expect(ads[0]).toHaveProperty('headline');
      expect(ads[0]).toHaveProperty('description');
    });

    it('deduplicates by advertiser + headline', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ads: [
              {
                title: 'Same Headline',
                description: 'Desc 1',
                advertiser: 'SameAdvertiser',
                displayed_link: 'www.test.com',
                position: 1,
              },
              {
                title: 'Same Headline',
                description: 'Desc 2',
                advertiser: 'SameAdvertiser',
                displayed_link: 'www.test.com',
                position: 2,
              },
            ],
          }),
        } as Response)
      );

      const ads = await collectGoogleAds('test', []);
      const keys = ads.map(ad => `${ad.advertiser_name}:${ad.headline.slice(0, 50)}`);
      const uniqueKeys = [...new Set(keys)];

      expect(keys.length).toBe(uniqueKeys.length);
    });

    it('handles API errors gracefully', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const ads = await collectGoogleAds('test', []);

      // Should return mock data on error
      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBeGreaterThan(0);
    });

    it('handles rate limiting between searches', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ads: [
              {
                title: 'Test Ad',
                description: 'Test description',
                advertiser: 'TestCo',
                displayed_link: 'www.test.com',
              },
            ],
          }),
        } as Response)
      );

      const start = Date.now();
      await collectGoogleAds('test', ['term1']);
      const elapsed = Date.now() - start;

      // Should have delay between requests (500ms per term)
      expect(elapsed).toBeGreaterThanOrEqual(400);
    });

    it('uses mock data when SERPAPI_KEY is not set', async () => {
      const originalEnv = process.env.SERPAPI_KEY;
      delete process.env.SERPAPI_KEY;

      const ads = await collectGoogleAds('test query', []);

      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBeGreaterThan(0);
      expect(ads[0].source).toBe('google');

      process.env.SERPAPI_KEY = originalEnv;
    });
  });

  describe('searchGoogleAds', () => {
    it('searches Google ads via SerpAPI', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ads: [
              {
                title: 'Test Ad',
                description: 'Test description',
                advertiser: 'TestCo',
                displayed_link: 'www.test.com',
                link: 'https://test.com',
              },
            ],
          }),
        } as Response)
      );

      const ads = await searchGoogleAds('test query');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('serpapi.com/search.json'),
      );
      expect(ads.length).toBeGreaterThan(0);
      expect(ads[0].ad_type).toBe('search');
    });

    it('parses shopping ads when available', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            shopping_results: [
              {
                title: 'Product Name',
                snippet: 'Product description',
                source: 'Amazon',
                price: '$29.99',
                link: 'https://amazon.com/product',
              },
            ],
          }),
        } as Response)
      );

      const ads = await searchGoogleAds('product name');

      expect(ads.length).toBeGreaterThan(0);
      expect(ads[0].ad_type).toBe('shopping');
      expect(ads[0].advertiser_name).toBe('Amazon');
    });

    it('applies search options correctly', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ads: [] }),
        } as Response)
      );

      await searchGoogleAds('test', {
        country: 'uk',
        language: 'en-GB',
        limit: 50,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gl=uk'),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('hl=en-GB'),
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('num=50'),
      );
    });

    it('returns mock data when no ads found', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      );

      const ads = await searchGoogleAds('test query');

      // Should fallback to mock data
      expect(ads.length).toBeGreaterThan(0);
      expect(ads[0].source).toBe('google');
    });

    it('handles SerpAPI errors gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      );

      const ads = await searchGoogleAds('test');

      // Should return mock data on API failure
      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBeGreaterThan(0);
    });

    it('parses display ads when available', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            inline_images: [
              {
                title: 'Premium Fitness App',
                link: 'https://example.com/fitness',
                source: 'example.com',
                thumbnail: 'https://example.com/thumb.jpg',
                original: 'https://example.com/image.jpg',
              },
            ],
          }),
        } as Response)
      );

      const ads = await searchGoogleAds('fitness app', { adType: 'display' });

      expect(ads.length).toBeGreaterThan(0);
      const displayAd = ads.find(ad => ad.ad_type === 'display');
      expect(displayAd).toBeDefined();
      expect(displayAd?.advertiser_name).toBe('example.com');
      expect(displayAd?.raw_payload).toHaveProperty('thumbnail');
    });

    it('collects creative URLs from display ads', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            inline_images: [
              {
                title: 'Visual Ad',
                link: 'https://brand.com/landing',
                source: 'brand.com',
                thumbnail: 'https://cdn.example.com/thumb.jpg',
                original: 'https://cdn.example.com/creative.jpg',
              },
            ],
          }),
        } as Response)
      );

      const ads = await searchGoogleAds('test product', { adType: 'display' });

      expect(ads.length).toBeGreaterThan(0);
      const displayAd = ads.find(ad => ad.ad_type === 'display');
      expect(displayAd?.raw_payload).toHaveProperty('thumbnail');
      expect(displayAd?.raw_payload).toHaveProperty('original');
    });

    it('filters ads by type when adType option is provided', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ads: [
              {
                title: 'Search Ad',
                description: 'Search result',
                advertiser: 'SearchCo',
                displayed_link: 'www.search.com',
              },
            ],
            inline_images: [
              {
                title: 'Display Ad',
                link: 'https://display.com',
                source: 'display.com',
                thumbnail: 'https://img.com/thumb.jpg',
              },
            ],
          }),
        } as Response)
      );

      const searchAds = await searchGoogleAds('test', { adType: 'search' });
      expect(searchAds.every(ad => ad.ad_type === 'search')).toBe(true);

      const displayAds = await searchGoogleAds('test', { adType: 'display' });
      expect(displayAds.every(ad => ad.ad_type === 'display')).toBe(true);
    });
  });
});

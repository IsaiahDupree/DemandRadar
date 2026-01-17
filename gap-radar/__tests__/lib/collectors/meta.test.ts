/**
 * Meta Ads Collector Tests
 */

import { collectMetaAds, fetchUserAdAccounts, fetchAccountAds } from '@/lib/collectors/meta';

describe('Meta Ads Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables for each test
    delete process.env.META_ACCESS_TOKEN;
    delete process.env.META_AD_LIBRARY_ACCESS;
  });

  describe('collectMetaAds', () => {
    it('returns array of ads', async () => {
      process.env.META_ACCESS_TOKEN = 'test-token';
      process.env.META_AD_LIBRARY_ACCESS = 'true';

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                page_name: 'Test Advertiser',
                ad_creative_bodies: ['Test ad creative text'],
                ad_creative_link_titles: ['Test Headline'],
                ad_creative_link_captions: ['Test Description'],
                ad_delivery_start_time: '2024-01-01T00:00:00Z',
                ad_delivery_stop_time: null,
              },
            ],
          }),
        } as Response)
      );

      const ads = await collectMetaAds('fitness app', ['workout']);

      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBeGreaterThan(0);
      expect(ads[0]).toHaveProperty('source', 'meta');
      expect(ads[0]).toHaveProperty('advertiser_name');
      expect(ads[0]).toHaveProperty('creative_text');
      expect(ads[0]).toHaveProperty('media_type');
    });

    it('deduplicates ads by advertiser and creative text', async () => {
      process.env.META_ACCESS_TOKEN = 'test-token';
      process.env.META_AD_LIBRARY_ACCESS = 'true';

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                page_name: 'Same Advertiser',
                ad_creative_bodies: ['Same text'],
                ad_delivery_start_time: '2024-01-01T00:00:00Z',
              },
              {
                page_name: 'Same Advertiser',
                ad_creative_bodies: ['Same text'],
                ad_delivery_start_time: '2024-01-02T00:00:00Z',
              },
            ],
          }),
        } as Response)
      );

      const ads = await collectMetaAds('test', []);

      // Should deduplicate based on advertiser + creative text
      expect(ads.length).toBe(1);
    });

    it('falls back to mock data when no access token', async () => {
      const ads = await collectMetaAds('fitness app', []);

      // Should return mock data
      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBeGreaterThan(0);
      expect(ads[0].source).toBe('meta');
    });

    it('handles API errors gracefully', async () => {
      process.env.META_ACCESS_TOKEN = 'test-token';
      process.env.META_AD_LIBRARY_ACCESS = 'true';

      global.fetch = jest.fn(() => Promise.reject(new Error('API error')));

      const ads = await collectMetaAds('test', []);

      // Should return mock data on error
      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBeGreaterThan(0);
    });

    it('handles API error responses', async () => {
      process.env.META_ACCESS_TOKEN = 'test-token';
      process.env.META_AD_LIBRARY_ACCESS = 'true';

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: { message: 'Invalid request' } }),
        } as Response)
      );

      const ads = await collectMetaAds('test', []);

      // Should return mock data on error response
      expect(Array.isArray(ads)).toBe(true);
    });
  });

  describe('fetchUserAdAccounts', () => {
    it('fetches user ad accounts with token', async () => {
      process.env.META_ACCESS_TOKEN = 'test-token';

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                id: 'act_123',
                name: 'Test Account',
                account_status: 1,
                amount_spent: '1000',
                currency: 'USD',
              },
            ],
          }),
        } as Response)
      );

      const accounts = await fetchUserAdAccounts();

      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBe(1);
      expect(accounts[0].id).toBe('act_123');
      expect(accounts[0].name).toBe('Test Account');
    });

    it('returns empty array without token', async () => {
      const accounts = await fetchUserAdAccounts();

      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBe(0);
    });

    it('handles API errors', async () => {
      process.env.META_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const accounts = await fetchUserAdAccounts();

      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBe(0);
    });
  });

  describe('fetchAccountAds', () => {
    it('fetches ads from specific account', async () => {
      process.env.META_ACCESS_TOKEN = 'test-token';

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: [
              {
                id: '123',
                name: 'Test Ad',
                status: 'ACTIVE',
                created_time: '2024-01-01T00:00:00Z',
                creative: {
                  body: 'Test creative',
                  title: 'Test Title',
                  call_to_action_type: 'LEARN_MORE',
                  link_url: 'https://example.com',
                },
              },
            ],
          }),
        } as Response)
      );

      const ads = await fetchAccountAds('act_123');

      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBe(1);
      expect(ads[0].source).toBe('meta');
      expect(ads[0].creative_text).toBe('Test creative');
      expect(ads[0].headline).toBe('Test Title');
    });

    it('returns empty array without token', async () => {
      const ads = await fetchAccountAds('act_123');

      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBe(0);
    });

    it('handles API errors', async () => {
      process.env.META_ACCESS_TOKEN = 'test-token';
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const ads = await fetchAccountAds('act_123');

      expect(Array.isArray(ads)).toBe(true);
      expect(ads.length).toBe(0);
    });
  });
});

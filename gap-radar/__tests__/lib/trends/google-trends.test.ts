/**
 * Google Trends Integration Tests
 * Tests for Google Trends as a trend source
 */

import { fetchGoogleTrends, normalizeGoogleTrend } from '@/lib/trends/google-trends';
import type { TrendingTopic } from '@/lib/trends/fallback';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Google Trends Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('fetchGoogleTrends', () => {
    it('fetches trending topics from Google Trends', async () => {
      const mockGoogleTrendsData = {
        default: {
          trendingSearchesDays: [
            {
              trendingSearches: [
                {
                  title: { query: 'AI productivity tools' },
                  formattedTraffic: '100K+',
                  articles: [
                    {
                      title: 'Best AI Tools for Productivity',
                      snippet: 'AI tools are revolutionizing productivity',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const jsonString = ")]}'\n" + JSON.stringify(mockGoogleTrendsData);

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => jsonString,
      });

      const trends = await fetchGoogleTrends();

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
    });

    it('returns at most 12 trends', async () => {
      const mockTrendingSearches = Array.from({ length: 20 }, (_, i) => ({
        title: { query: `Test Topic ${i}` },
        formattedTraffic: '50K+',
        articles: [
          {
            title: `Article ${i}`,
            snippet: `Snippet ${i}`,
          },
        ],
      }));

      const mockGoogleTrendsData = {
        default: {
          trendingSearchesDays: [
            {
              trendingSearches: mockTrendingSearches,
            },
          ],
        },
      };

      const jsonString = ")]}'\n" + JSON.stringify(mockGoogleTrendsData);

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => jsonString,
      });

      const trends = await fetchGoogleTrends();

      expect(trends.length).toBeLessThanOrEqual(12);
    });

    it('handles API errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const trends = await fetchGoogleTrends();

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBe(0);
    });

    it('handles rate limiting (429) gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const trends = await fetchGoogleTrends();

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBe(0);
    });

    it('applies geographic filtering when provided', async () => {
      const mockGoogleTrendsData = {
        default: {
          trendingSearchesDays: [
            {
              trendingSearches: [
                {
                  title: { query: 'US specific topic' },
                  formattedTraffic: '75K+',
                  articles: [
                    {
                      title: 'US Article',
                      snippet: 'US Snippet',
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const jsonString = ")]}'\n" + JSON.stringify(mockGoogleTrendsData);

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => jsonString,
      });

      const trends = await fetchGoogleTrends('US');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('geo=US'),
        expect.any(Object)
      );
      expect(trends.length).toBeGreaterThan(0);
    });

    it('respects rate limiting with proper headers', async () => {
      const mockGoogleTrendsData = {
        default: {
          trendingSearchesDays: [
            {
              trendingSearches: [
                {
                  title: { query: 'Test Topic' },
                  formattedTraffic: '50K+',
                  articles: [{ title: 'Test', snippet: 'Test' }],
                },
              ],
            },
          ],
        },
      };

      const jsonString = ")]}'\n" + JSON.stringify(mockGoogleTrendsData);

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => jsonString,
      });

      await fetchGoogleTrends();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
          }),
        })
      );
    });
  });

  describe('normalizeGoogleTrend', () => {
    it('converts Google Trends data to TrendingTopic format', () => {
      const googleTrend = {
        title: { query: 'AI writing assistants' },
        formattedTraffic: '100K+',
        articles: [
          {
            title: 'Best AI Writing Tools 2026',
            snippet: 'AI writing tools are becoming more popular for content creators',
          },
        ],
      };

      const normalized = normalizeGoogleTrend(googleTrend);

      expect(normalized).toHaveProperty('id');
      expect(normalized).toHaveProperty('topic');
      expect(normalized).toHaveProperty('category');
      expect(normalized).toHaveProperty('volume');
      expect(normalized).toHaveProperty('growth');
      expect(normalized).toHaveProperty('sentiment');
      expect(normalized).toHaveProperty('sources');
      expect(normalized).toHaveProperty('relatedTerms');
      expect(normalized).toHaveProperty('opportunityScore');
    });

    it('sets correct topic from Google Trends query', () => {
      const googleTrend = {
        title: { query: 'NoCode app builders' },
        formattedTraffic: '50K+',
        articles: [{ title: 'Test', snippet: 'Test' }],
      };

      const normalized = normalizeGoogleTrend(googleTrend);

      expect(normalized.topic).toBe('NoCode app builders');
    });

    it('parses traffic volume correctly', () => {
      const testCases = [
        { traffic: '100K+', expectedMin: 100000 },
        { traffic: '50K+', expectedMin: 50000 },
        { traffic: '10K+', expectedMin: 10000 },
        { traffic: '1M+', expectedMin: 1000000 },
      ];

      testCases.forEach(({ traffic, expectedMin }) => {
        const googleTrend = {
          title: { query: 'Test' },
          formattedTraffic: traffic,
          articles: [{ title: 'Test', snippet: 'Test' }],
        };

        const normalized = normalizeGoogleTrend(googleTrend);

        expect(normalized.volume).toBeGreaterThanOrEqual(expectedMin * 0.8);
      });
    });

    it('categorizes topics correctly', () => {
      const testCases = [
        { query: 'AI chatbot tools', expectedCategory: 'AI & Automation' },
        { query: 'SEO marketing software', expectedCategory: 'Marketing' },
        { query: 'productivity apps', expectedCategory: 'Productivity' },
        { query: 'ecommerce platforms', expectedCategory: 'E-commerce' },
      ];

      testCases.forEach(({ query, expectedCategory }) => {
        const googleTrend = {
          title: { query },
          formattedTraffic: '50K+',
          articles: [{ title: 'Test', snippet: 'Test' }],
        };

        const normalized = normalizeGoogleTrend(googleTrend);

        expect(normalized.category).toBe(expectedCategory);
      });
    });

    it('extracts related terms from articles', () => {
      const googleTrend = {
        title: { query: 'AI productivity tools' },
        formattedTraffic: '100K+',
        articles: [
          {
            title: 'Best AI Tools for Productivity and Automation',
            snippet: 'AI tools help with automation, productivity, and efficiency',
          },
        ],
      };

      const normalized = normalizeGoogleTrend(googleTrend);

      expect(Array.isArray(normalized.relatedTerms)).toBe(true);
      expect(normalized.relatedTerms.length).toBeGreaterThan(0);
    });

    it('sets source as Google Trends', () => {
      const googleTrend = {
        title: { query: 'Test Topic' },
        formattedTraffic: '50K+',
        articles: [{ title: 'Test', snippet: 'Test' }],
      };

      const normalized = normalizeGoogleTrend(googleTrend);

      expect(normalized.sources).toContain('Google Trends');
    });

    it('calculates opportunity score within 0-100 range', () => {
      const googleTrend = {
        title: { query: 'Test Topic' },
        formattedTraffic: '100K+',
        articles: [
          {
            title: 'Great article',
            snippet: 'Amazing content',
          },
        ],
      };

      const normalized = normalizeGoogleTrend(googleTrend);

      expect(normalized.opportunityScore).toBeGreaterThanOrEqual(0);
      expect(normalized.opportunityScore).toBeLessThanOrEqual(100);
    });

    it('sets growth score within 0-100 range', () => {
      const googleTrend = {
        title: { query: 'Test Topic' },
        formattedTraffic: '50K+',
        articles: [{ title: 'Test', snippet: 'Test' }],
      };

      const normalized = normalizeGoogleTrend(googleTrend);

      expect(normalized.growth).toBeGreaterThanOrEqual(0);
      expect(normalized.growth).toBeLessThanOrEqual(100);
    });

    it('analyzes sentiment from articles', () => {
      const positiveGoogleTrend = {
        title: { query: 'Amazing productivity tools' },
        formattedTraffic: '50K+',
        articles: [
          {
            title: 'Best and most innovative tools',
            snippet: 'These tools are excellent and highly recommended',
          },
        ],
      };

      const normalized = normalizeGoogleTrend(positiveGoogleTrend);

      expect(['positive', 'negative', 'neutral']).toContain(normalized.sentiment);
    });
  });
});

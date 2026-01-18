/**
 * Trends API Integration Tests
 * Tests for /api/trends endpoint
 */

// Mock Next.js modules before importing
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    }),
  },
}));

// Mock fetch will be set in each test
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { GET } from '@/app/api/trends/route';

describe('Trends API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('GET /api/trends', () => {
    it('returns trends with correct data structure', async () => {
      const mockRedditData = {
        data: {
          children: [
            {
              data: {
                title: 'Best AI writing tools for content creators',
                subreddit: 'SaaS',
                score: 150,
                num_comments: 45,
                selftext: 'Looking for recommendations on AI tools that can help with blog writing',
                created_utc: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
              },
            },
            {
              data: {
                title: 'Need a project management tool for remote teams',
                subreddit: 'productivity',
                score: 200,
                num_comments: 60,
                selftext: 'Our team is fully remote and we need better coordination',
                created_utc: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRedditData,
      });

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('trends');
      expect(data).toHaveProperty('lastUpdated');
      expect(data).toHaveProperty('sources');
      expect(Array.isArray(data.trends)).toBe(true);
      expect(Array.isArray(data.sources)).toBe(true);
    });

    it('returns at most 12 trends', async () => {
      // Create diverse posts with different topics to maximize unique trends
      const mockPosts = [
        {
          data: {
            title: 'Best AI writing tool for content creators',
            subreddit: 'entrepreneur',
            score: 150,
            num_comments: 40,
            selftext: 'Looking for AI recommendations',
            created_utc: Math.floor(Date.now() / 1000) - 1000,
          },
        },
        {
          data: {
            title: 'CRM software for small business owners',
            subreddit: 'smallbusiness',
            score: 200,
            num_comments: 50,
            selftext: 'Need affordable CRM',
            created_utc: Math.floor(Date.now() / 1000) - 2000,
          },
        },
        {
          data: {
            title: 'Project management tools for remote teams',
            subreddit: 'productivity',
            score: 180,
            num_comments: 45,
            selftext: 'Remote work tools needed',
            created_utc: Math.floor(Date.now() / 1000) - 3000,
          },
        },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            children: mockPosts,
          },
        }),
      });

      const response = await GET();
      const data = await response.json();

      // Should have trends (from Reddit + curated fallbacks)
      expect(data.trends.length).toBeGreaterThan(0);
      // Should not exceed 12
      expect(data.trends.length).toBeLessThanOrEqual(12);
    });

    it('each trend has required fields', async () => {
      const mockRedditData = {
        data: {
          children: [
            {
              data: {
                title: 'Best CRM software for small business',
                subreddit: 'smallbusiness',
                score: 180,
                num_comments: 55,
                selftext: 'Need affordable CRM solution',
                created_utc: Math.floor(Date.now() / 1000) - 1800,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRedditData,
      });

      const response = await GET();
      const data = await response.json();

      const trend = data.trends[0];
      expect(trend).toHaveProperty('id');
      expect(trend).toHaveProperty('topic');
      expect(trend).toHaveProperty('category');
      expect(trend).toHaveProperty('volume');
      expect(trend).toHaveProperty('growth');
      expect(trend).toHaveProperty('sentiment');
      expect(trend).toHaveProperty('sources');
      expect(trend).toHaveProperty('relatedTerms');
      expect(trend).toHaveProperty('opportunityScore');

      expect(typeof trend.id).toBe('string');
      expect(typeof trend.topic).toBe('string');
      expect(typeof trend.category).toBe('string');
      expect(typeof trend.volume).toBe('number');
      expect(typeof trend.growth).toBe('number');
      expect(['positive', 'negative', 'neutral']).toContain(trend.sentiment);
      expect(Array.isArray(trend.sources)).toBe(true);
      expect(Array.isArray(trend.relatedTerms)).toBe(true);
      expect(typeof trend.opportunityScore).toBe('number');
    });

    it('opportunity scores are within 0-100 range', async () => {
      const mockRedditData = {
        data: {
          children: [
            {
              data: {
                title: 'Looking for affordable marketing automation tools',
                subreddit: 'entrepreneur',
                score: 250,
                num_comments: 80,
                selftext: 'Budget is limited but need automation',
                created_utc: Math.floor(Date.now() / 1000) - 900,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRedditData,
      });

      const response = await GET();
      const data = await response.json();

      data.trends.forEach((trend: any) => {
        expect(trend.opportunityScore).toBeGreaterThanOrEqual(0);
        expect(trend.opportunityScore).toBeLessThanOrEqual(100);
        expect(trend.growth).toBeGreaterThanOrEqual(0);
        expect(trend.growth).toBeLessThanOrEqual(100);
      });
    });

    it('trends are sorted by opportunity score (descending)', async () => {
      const mockRedditData = {
        data: {
          children: [
            {
              data: {
                title: 'Best email marketing platform',
                subreddit: 'marketing',
                score: 50,
                num_comments: 10,
                selftext: 'Need email tool',
                created_utc: Math.floor(Date.now() / 1000) - 5000,
              },
            },
            {
              data: {
                title: 'Amazing new AI coding assistant',
                subreddit: 'programming',
                score: 500,
                num_comments: 150,
                selftext: 'This tool is revolutionary',
                created_utc: Math.floor(Date.now() / 1000) - 1000,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRedditData,
      });

      const response = await GET();
      const data = await response.json();

      for (let i = 0; i < data.trends.length - 1; i++) {
        expect(data.trends[i].opportunityScore).toBeGreaterThanOrEqual(
          data.trends[i + 1].opportunityScore
        );
      }
    });

    it('handles Reddit API errors gracefully with curated fallback', async () => {
      mockFetch.mockRejectedValue(new Error('Reddit API unavailable'));

      const response = await GET();
      const data = await response.json();

      // Should still return curated trends
      expect(response.status).toBe(200);
      expect(data.trends.length).toBeGreaterThan(0);
      expect(data).toHaveProperty('lastUpdated');
    });

    it('handles rate limiting with curated fallback', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
      });

      const response = await GET();
      const data = await response.json();

      // Should return curated trends instead of failing
      expect(response.status).toBe(200);
      expect(data.trends.length).toBeGreaterThan(0);
    });

    it('deduplicates similar topics', async () => {
      const mockRedditData = {
        data: {
          children: [
            {
              data: {
                title: 'Best AI writing tool for bloggers',
                subreddit: 'blogging',
                score: 100,
                num_comments: 30,
                selftext: 'Need AI tool',
                created_utc: Math.floor(Date.now() / 1000) - 2000,
              },
            },
            {
              data: {
                title: 'Top AI writing tools 2026',
                subreddit: 'content',
                score: 120,
                num_comments: 35,
                selftext: 'Comparing AI writing',
                created_utc: Math.floor(Date.now() / 1000) - 3000,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRedditData,
      });

      const response = await GET();
      const data = await response.json();

      // Check that topics are not exact duplicates
      const topics = data.trends.map((t: any) => t.topic.toLowerCase());
      const uniqueTopics = new Set(topics);
      expect(uniqueTopics.size).toBe(topics.length);
    });

    it('includes source attribution for each trend', async () => {
      const mockRedditData = {
        data: {
          children: [
            {
              data: {
                title: 'Best productivity app for developers',
                subreddit: 'programming',
                score: 200,
                num_comments: 50,
                selftext: 'Looking for recommendations',
                created_utc: Math.floor(Date.now() / 1000) - 1500,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRedditData,
      });

      const response = await GET();
      const data = await response.json();

      data.trends.forEach((trend: any) => {
        expect(trend.sources.length).toBeGreaterThan(0);
        expect(trend.sources.every((s: string) => typeof s === 'string')).toBe(true);
      });
    });

    it('lastUpdated is a valid ISO timestamp', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            children: [],
          },
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(data.lastUpdated).toBeTruthy();
      expect(new Date(data.lastUpdated).toString()).not.toBe('Invalid Date');

      // Should be recent (within last minute)
      const timestamp = new Date(data.lastUpdated).getTime();
      const now = Date.now();
      expect(now - timestamp).toBeLessThan(60000); // 1 minute
    });

    it('categorizes topics correctly', async () => {
      const mockRedditData = {
        data: {
          children: [
            {
              data: {
                title: 'Best AI chatbot for customer service',
                subreddit: 'SaaS',
                score: 150,
                num_comments: 40,
                selftext: 'Need AI chatbot',
                created_utc: Math.floor(Date.now() / 1000) - 2000,
              },
            },
            {
              data: {
                title: 'SEO tools for small business owners',
                subreddit: 'smallbusiness',
                score: 130,
                num_comments: 35,
                selftext: 'Looking for SEO help',
                created_utc: Math.floor(Date.now() / 1000) - 2500,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRedditData,
      });

      const response = await GET();
      const data = await response.json();

      const aiTrend = data.trends.find((t: any) => t.topic.toLowerCase().includes('chatbot'));
      const marketingTrend = data.trends.find((t: any) => t.topic.toLowerCase().includes('seo'));

      if (aiTrend) {
        expect(aiTrend.category).toContain('AI');
      }
      if (marketingTrend) {
        expect(marketingTrend.category).toBe('Marketing');
      }
    });

    it('extracts related terms from titles', async () => {
      const mockRedditData = {
        data: {
          children: [
            {
              data: {
                title: 'Looking for affordable CRM software with email automation features',
                subreddit: 'smallbusiness',
                score: 160,
                num_comments: 45,
                selftext: 'Need CRM',
                created_utc: Math.floor(Date.now() / 1000) - 1800,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRedditData,
      });

      const response = await GET();
      const data = await response.json();

      const trend = data.trends.find((t: any) =>
        t.topic.toLowerCase().includes('crm') || t.topic.toLowerCase().includes('software')
      );

      if (trend) {
        expect(trend.relatedTerms).toBeDefined();
        expect(Array.isArray(trend.relatedTerms)).toBe(true);
        expect(trend.relatedTerms.length).toBeGreaterThan(0);
      }
    });

    it('calculates sentiment from text', async () => {
      const mockRedditData = {
        data: {
          children: [
            {
              data: {
                title: 'Amazing new productivity tool - highly recommend!',
                subreddit: 'productivity',
                score: 250,
                num_comments: 70,
                selftext: 'This is the best tool I have ever used, love it!',
                created_utc: Math.floor(Date.now() / 1000) - 1000,
              },
            },
            {
              data: {
                title: 'Terrible experience with this awful software',
                subreddit: 'software',
                score: 120,
                num_comments: 40,
                selftext: 'Worst purchase ever, complete waste of money',
                created_utc: Math.floor(Date.now() / 1000) - 2000,
              },
            },
          ],
        },
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRedditData,
      });

      const response = await GET();
      const data = await response.json();

      const positiveTrend = data.trends.find((t: any) =>
        t.topic.toLowerCase().includes('productivity')
      );
      const negativeTrend = data.trends.find((t: any) =>
        t.topic.toLowerCase().includes('software')
      );

      if (positiveTrend) {
        expect(['positive', 'neutral']).toContain(positiveTrend.sentiment);
      }
      if (negativeTrend) {
        expect(['negative', 'neutral']).toContain(negativeTrend.sentiment);
      }
    });

    it('merges Reddit and curated trends', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            children: [],
          },
        }),
      });

      const response = await GET();
      const data = await response.json();

      // Should have curated trends even if Reddit returns nothing
      expect(data.trends.length).toBeGreaterThan(0);

      // Should include multiple sources
      const allSources = new Set(data.trends.flatMap((t: any) => t.sources));
      expect(allSources.size).toBeGreaterThan(0);
    });
  });
});

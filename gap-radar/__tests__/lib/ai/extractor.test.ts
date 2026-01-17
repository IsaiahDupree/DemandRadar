/**
 * AI Extractor Tests
 */

import { extractInsights, resetOpenAIInstance } from '@/lib/ai/extractor';
import OpenAI from 'openai';

jest.mock('openai');

const mockMetaAds = [
  {
    source: 'meta' as const,
    advertiser_name: 'FitnessPro',
    headline: 'Get Fit Fast',
    creative_text: 'The fastest way to get in shape. Try free for 30 days.',
    cta: 'Sign Up Now',
    first_seen: '2024-01-01',
    last_seen: '2024-03-01',
  },
  {
    source: 'meta' as const,
    advertiser_name: 'QuickFit',
    headline: 'Easy Workouts',
    creative_text: 'Simple workouts that work. Join 10,000 users.',
    cta: 'Get Started',
    first_seen: '2024-02-01',
    last_seen: '2024-03-01',
  },
];

const mockRedditMentions = [
  {
    subreddit: 'fitness',
    title: 'Fitness apps are too expensive',
    body: 'Why do all fitness apps charge $20/month? I just want basic workout tracking.',
    score: 150,
    num_comments: 45,
    permalink: '/r/fitness/test1',
    created_utc: Date.now() / 1000,
  },
  {
    subreddit: 'fitness',
    title: 'Wish there was a better app',
    body: 'Current fitness apps have terrible UX. Need something simple and clean.',
    score: 89,
    num_comments: 23,
    permalink: '/r/fitness/test2',
    created_utc: Date.now() / 1000,
  },
];

describe('AI Extractor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetOpenAIInstance();
  });

  describe('extractInsights', () => {
    it('returns extractions and clusters structure', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                extractions: [
                  {
                    index: 1,
                    offers: ['30-day free trial'],
                    claims: ['Fastest results'],
                    angles: ['speed', 'convenience'],
                  },
                ],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      const result = await extractInsights(mockMetaAds, mockRedditMentions, 'fitness app');

      expect(result).toHaveProperty('extractions');
      expect(result).toHaveProperty('clusters');
      expect(Array.isArray(result.extractions)).toBe(true);
      expect(Array.isArray(result.clusters)).toBe(true);
    });

    it('processes ads correctly', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                extractions: [
                  {
                    index: 1,
                    offers: ['Free trial'],
                    claims: ['Fast results'],
                    angles: ['speed'],
                  },
                ],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      const result = await extractInsights(mockMetaAds, [], 'fitness app');

      expect(result.extractions.length).toBeGreaterThan(0);
      expect(result.extractions[0]).toHaveProperty('source_type', 'ad');
      expect(result.extractions[0]).toHaveProperty('offers');
      expect(result.extractions[0]).toHaveProperty('claims');
      expect(result.extractions[0]).toHaveProperty('angles');
    });

    it('processes Reddit mentions correctly', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                extractions: [
                  {
                    index: 1,
                    objections: ['Too expensive'],
                    desired_features: ['Better pricing'],
                    sentiment: { positive: 0.2, negative: 0.7, intensity: 0.8 },
                  },
                ],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      const result = await extractInsights([], mockRedditMentions, 'fitness app');

      expect(result.extractions.length).toBeGreaterThan(0);
      expect(result.extractions[0]).toHaveProperty('source_type', 'reddit');
      expect(result.extractions[0]).toHaveProperty('objections');
      expect(result.extractions[0]).toHaveProperty('desired_features');
      expect(result.extractions[0]).toHaveProperty('sentiment');
    });

    it('creates clusters from extractions', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                extractions: [
                  {
                    index: 1,
                    offers: [],
                    claims: [],
                    angles: ['speed', 'fast results', 'quick'],
                  },
                ],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      const result = await extractInsights(mockMetaAds, [], 'fitness app');

      expect(result.clusters.length).toBeGreaterThan(0);
      expect(result.clusters[0]).toHaveProperty('cluster_type');
      expect(result.clusters[0]).toHaveProperty('label');
      expect(result.clusters[0]).toHaveProperty('frequency');
      expect(result.clusters[0]).toHaveProperty('intensity');
    });

    it('uses mock data when API key is not set', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await extractInsights(mockMetaAds, mockRedditMentions, 'fitness app');

      expect(result.extractions.length).toBeGreaterThan(0);
      expect(result.clusters.length).toBeGreaterThan(0);
    });

    it('handles API errors gracefully', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('API error'));

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      const result = await extractInsights(mockMetaAds, mockRedditMentions, 'fitness app');

      // Should still return data (fallback to mock or empty)
      expect(result).toHaveProperty('extractions');
      expect(result).toHaveProperty('clusters');
      expect(Array.isArray(result.extractions)).toBe(true);
      expect(Array.isArray(result.clusters)).toBe(true);
    });

    it('handles empty input gracefully', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await extractInsights([], [], 'test');

      expect(Array.isArray(result.extractions)).toBe(true);
      expect(Array.isArray(result.clusters)).toBe(true);
    });

    it('limits batch processing to reasonable sizes', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                extractions: [],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      const manyAds = Array(50).fill(mockMetaAds[0]);
      await extractInsights(manyAds, [], 'test');

      // Should only process first 20 ads
      expect(mockCreate).toHaveBeenCalled();
      const callContent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(callContent).toContain('1.');
      expect(callContent).toContain('20.');
      expect(callContent).not.toContain('21.');
    });
  });
});

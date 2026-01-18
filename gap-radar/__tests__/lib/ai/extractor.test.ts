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

  describe('Prompt Construction', () => {
    it('constructs proper ad extraction prompt with niche context', async () => {
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

      await extractInsights(mockMetaAds, [], 'fitness app');

      expect(mockCreate).toHaveBeenCalled();
      const prompt = mockCreate.mock.calls[0][0].messages[0].content;

      // Verify prompt includes niche context
      expect(prompt).toContain('fitness app');

      // Verify prompt asks for required fields
      expect(prompt).toContain('offers');
      expect(prompt).toContain('claims');
      expect(prompt).toContain('angles');

      // Verify ad content is included
      expect(prompt).toContain('Get Fit Fast');
    });

    it('constructs proper Reddit extraction prompt with objections and features', async () => {
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

      await extractInsights([], mockRedditMentions, 'fitness app');

      expect(mockCreate).toHaveBeenCalled();
      const prompt = mockCreate.mock.calls[0][0].messages[0].content;

      // Verify prompt includes niche context
      expect(prompt).toContain('fitness app');

      // Verify prompt asks for required fields
      expect(prompt).toContain('objections');
      expect(prompt).toContain('desired_features');
      expect(prompt).toContain('sentiment');

      // Verify mention content is included
      expect(prompt).toContain('too expensive');
    });

    it('uses correct OpenAI model and parameters', async () => {
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

      await extractInsights(mockMetaAds, [], 'test');

      expect(mockCreate).toHaveBeenCalled();
      const callParams = mockCreate.mock.calls[0][0];

      // Verify model
      expect(callParams.model).toBe('gpt-4o-mini');

      // Verify JSON response format
      expect(callParams.response_format).toEqual({ type: 'json_object' });

      // Verify temperature for consistency
      expect(callParams.temperature).toBe(0.3);
    });
  });

  describe('JSON Output Validation', () => {
    it('validates extraction output has required fields', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                extractions: [
                  {
                    index: 1,
                    offers: ['Free trial'],
                    claims: ['Fast'],
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

      const result = await extractInsights(mockMetaAds, [], 'test');

      // Validate extraction structure
      result.extractions.forEach(extraction => {
        expect(extraction).toHaveProperty('source_type');
        expect(['ad', 'reddit']).toContain(extraction.source_type);
        expect(extraction).toHaveProperty('source_id');
        expect(extraction).toHaveProperty('offers');
        expect(extraction).toHaveProperty('claims');
        expect(extraction).toHaveProperty('angles');
        expect(extraction).toHaveProperty('objections');
        expect(extraction).toHaveProperty('desired_features');
        expect(extraction).toHaveProperty('sentiment');

        // Validate sentiment structure
        expect(extraction.sentiment).toHaveProperty('positive');
        expect(extraction.sentiment).toHaveProperty('negative');
        expect(extraction.sentiment).toHaveProperty('intensity');
        expect(typeof extraction.sentiment.positive).toBe('number');
        expect(typeof extraction.sentiment.negative).toBe('number');
        expect(typeof extraction.sentiment.intensity).toBe('number');
      });
    });

    it('validates cluster output has required fields', async () => {
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

      const result = await extractInsights(mockMetaAds, [], 'test');

      // Validate cluster structure
      result.clusters.forEach(cluster => {
        expect(cluster).toHaveProperty('cluster_type');
        expect(['angle', 'objection', 'feature', 'offer']).toContain(cluster.cluster_type);
        expect(cluster).toHaveProperty('label');
        expect(cluster).toHaveProperty('examples');
        expect(cluster).toHaveProperty('frequency');
        expect(cluster).toHaveProperty('intensity');

        expect(typeof cluster.label).toBe('string');
        expect(Array.isArray(cluster.examples)).toBe(true);
        expect(typeof cluster.frequency).toBe('number');
        expect(typeof cluster.intensity).toBe('number');

        // Validate examples structure
        cluster.examples.forEach(example => {
          expect(example).toHaveProperty('id');
          expect(example).toHaveProperty('snippet');
        });
      });
    });

    it('handles malformed JSON response gracefully', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'not valid json',
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

      const result = await extractInsights(mockMetaAds, [], 'test');

      // Should return empty arrays on parse error
      expect(Array.isArray(result.extractions)).toBe(true);
      expect(Array.isArray(result.clusters)).toBe(true);
    });

    it('handles missing extractions field in response', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                results: [
                  {
                    index: 1,
                    offers: ['Free trial'],
                    claims: ['Fast'],
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

      const result = await extractInsights(mockMetaAds, [], 'test');

      // Should handle fallback field name
      expect(result.extractions.length).toBeGreaterThan(0);
    });

    it('handles empty response content', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
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

      const result = await extractInsights(mockMetaAds, [], 'test');

      // Should handle null content gracefully
      expect(Array.isArray(result.extractions)).toBe(true);
      expect(Array.isArray(result.clusters)).toBe(true);
    });
  });

  describe('Fallback Behavior', () => {
    it('uses mock data when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await extractInsights(mockMetaAds, mockRedditMentions, 'fitness app');

      // Should return mock data
      expect(result.extractions.length).toBeGreaterThan(0);
      expect(result.clusters.length).toBeGreaterThan(0);

      // Verify mock data has correct structure
      const adExtraction = result.extractions.find(e => e.source_type === 'ad');
      const redditExtraction = result.extractions.find(e => e.source_type === 'reddit');

      expect(adExtraction).toBeDefined();
      expect(redditExtraction).toBeDefined();

      if (adExtraction) {
        expect(adExtraction.offers.length).toBeGreaterThan(0);
        expect(adExtraction.claims.length).toBeGreaterThan(0);
      }

      if (redditExtraction) {
        expect(redditExtraction.objections.length).toBeGreaterThan(0);
        expect(redditExtraction.desired_features.length).toBeGreaterThan(0);
      }
    });

    it('includes realistic mock clusters', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await extractInsights(mockMetaAds, mockRedditMentions, 'fitness app');

      expect(result.clusters.length).toBeGreaterThan(0);

      // Verify cluster types
      const angleCluster = result.clusters.find(c => c.cluster_type === 'angle');
      const objectionCluster = result.clusters.find(c => c.cluster_type === 'objection');
      const featureCluster = result.clusters.find(c => c.cluster_type === 'feature');

      expect(angleCluster).toBeDefined();
      expect(objectionCluster).toBeDefined();
      expect(featureCluster).toBeDefined();
    });
  });
});

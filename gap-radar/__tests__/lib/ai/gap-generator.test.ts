/**
 * Gap Generator Tests
 */

import { generateGaps, resetOpenAIInstance } from '@/lib/ai/gap-generator';
import { Cluster } from '@/lib/ai/extractor';
import OpenAI from 'openai';

jest.mock('openai');

const mockClusters: Cluster[] = [
  {
    cluster_type: 'objection',
    label: 'Pricing too high',
    examples: [{ id: '1', snippet: 'Too expensive for what it does' }],
    frequency: 15,
    intensity: 0.8,
  },
  {
    cluster_type: 'objection',
    label: 'Poor quality results',
    examples: [{ id: '2', snippet: 'Results are not good enough' }],
    frequency: 12,
    intensity: 0.75,
  },
  {
    cluster_type: 'angle',
    label: 'Speed/Fast results',
    examples: [{ id: '3', snippet: 'Get results in seconds' }],
    frequency: 20,
    intensity: 0.6,
  },
  {
    cluster_type: 'feature',
    label: 'Better accuracy',
    examples: [{ id: '4', snippet: 'I wish it was more accurate' }],
    frequency: 8,
    intensity: 0.7,
  },
];

const mockAds = [
  {
    source: 'meta' as const,
    advertiser_name: 'TestCo',
    headline: 'Fast Results',
    creative_text: 'Get results in seconds with our tool.',
    cta: 'Try Now',
    first_seen: '2024-01-01',
    last_seen: '2024-03-01',
  },
];

const mockMentions = [
  {
    subreddit: 'test',
    title: 'Quality issues',
    body: 'The quality is not good enough for professional use.',
    score: 100,
    num_comments: 25,
    permalink: '/r/test/1',
    created_utc: Date.now() / 1000,
  },
];

describe('Gap Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetOpenAIInstance();
  });

  describe('generateGaps', () => {
    it('returns array of gap opportunities', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                gaps: [
                  {
                    gap_type: 'product',
                    title: 'Quality is ignored',
                    problem: 'Ads focus on speed, users want quality',
                    recommendation: 'Build quality-first product',
                    opportunity_score: 85,
                    confidence: 0.8,
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

      const gaps = await generateGaps(mockClusters, mockAds, mockMentions, 'test tool');

      expect(Array.isArray(gaps)).toBe(true);
      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps[0]).toHaveProperty('gap_type');
      expect(gaps[0]).toHaveProperty('title');
      expect(gaps[0]).toHaveProperty('problem');
      expect(gaps[0]).toHaveProperty('recommendation');
      expect(gaps[0]).toHaveProperty('opportunity_score');
      expect(gaps[0]).toHaveProperty('confidence');
    });

    it('validates gap types', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                gaps: [
                  {
                    gap_type: 'pricing',
                    title: 'Pricing gap',
                    problem: 'Too expensive',
                    recommendation: 'Lower prices',
                    opportunity_score: 75,
                    confidence: 0.7,
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

      const gaps = await generateGaps(mockClusters, mockAds, mockMentions, 'test');

      const validTypes = ['product', 'offer', 'positioning', 'trust', 'pricing'];
      gaps.forEach(gap => {
        expect(validTypes).toContain(gap.gap_type);
      });
    });

    it('includes evidence from ads and reddit', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                gaps: [
                  {
                    gap_type: 'product',
                    title: 'Test gap',
                    problem: 'Test problem',
                    recommendation: 'Test recommendation',
                    opportunity_score: 80,
                    confidence: 0.75,
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

      const gaps = await generateGaps(mockClusters, mockAds, mockMentions, 'test');

      expect(gaps[0]).toHaveProperty('evidence_ads');
      expect(gaps[0]).toHaveProperty('evidence_reddit');
      expect(Array.isArray(gaps[0].evidence_ads)).toBe(true);
      expect(Array.isArray(gaps[0].evidence_reddit)).toBe(true);
    });

    it('analyzes objection clusters', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                gaps: [],
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

      await generateGaps(mockClusters, mockAds, mockMentions, 'test');

      expect(mockCreate).toHaveBeenCalled();
      const prompt = mockCreate.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain('USER OBJECTIONS');
      expect(prompt).toContain('Pricing too high');
      expect(prompt).toContain('Poor quality results');
    });

    it('uses mock data when API key is not set', async () => {
      delete process.env.OPENAI_API_KEY;

      const gaps = await generateGaps(mockClusters, mockAds, mockMentions, 'test');

      expect(Array.isArray(gaps)).toBe(true);
      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps[0]).toHaveProperty('gap_type');
      expect(gaps[0]).toHaveProperty('title');
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

      const gaps = await generateGaps(mockClusters, mockAds, mockMentions, 'test');

      // Should fallback to mock data
      expect(Array.isArray(gaps)).toBe(true);
      expect(gaps.length).toBeGreaterThan(0);
    });

    it('handles empty clusters gracefully', async () => {
      delete process.env.OPENAI_API_KEY;

      const gaps = await generateGaps([], [], [], 'test');

      expect(Array.isArray(gaps)).toBe(true);
    });

    it('scores opportunities between 0-100', async () => {
      delete process.env.OPENAI_API_KEY;

      const gaps = await generateGaps(mockClusters, mockAds, mockMentions, 'test');

      gaps.forEach(gap => {
        expect(gap.opportunity_score).toBeGreaterThanOrEqual(0);
        expect(gap.opportunity_score).toBeLessThanOrEqual(100);
      });
    });

    it('confidence scores between 0-1', async () => {
      delete process.env.OPENAI_API_KEY;

      const gaps = await generateGaps(mockClusters, mockAds, mockMentions, 'test');

      gaps.forEach(gap => {
        expect(gap.confidence).toBeGreaterThanOrEqual(0);
        expect(gap.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('handles invalid JSON response', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'invalid json',
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

      const gaps = await generateGaps(mockClusters, mockAds, mockMentions, 'test');

      // Should fallback to mock data
      expect(Array.isArray(gaps)).toBe(true);
    });
  });
});

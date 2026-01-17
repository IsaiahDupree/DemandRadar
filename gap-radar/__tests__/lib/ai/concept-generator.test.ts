/**
 * Concept Generator Tests
 */

import { generateConcepts, resetOpenAIInstance } from '@/lib/ai/concept-generator';
import { GapOpportunity } from '@/lib/ai/gap-generator';
import { Cluster } from '@/lib/ai/extractor';
import { AppStoreResult } from '@/lib/collectors/appstore';
import OpenAI from 'openai';

jest.mock('openai');

const mockGaps: GapOpportunity[] = [
  {
    gap_type: 'product',
    title: 'Quality gap',
    problem: 'Users want quality, ads focus on speed',
    evidence_ads: [{ id: 'ad1', snippet: 'Fast results' }],
    evidence_reddit: [{ id: 'r1', snippet: 'Poor quality' }],
    recommendation: 'Build quality-first product',
    opportunity_score: 85,
    confidence: 0.8,
  },
];

const mockClusters: Cluster[] = [
  {
    cluster_type: 'objection',
    label: 'Pricing issues',
    examples: [{ id: '1', snippet: 'Too expensive' }],
    frequency: 10,
    intensity: 0.7,
  },
];

const mockAppStoreResults: AppStoreResult[] = [
  {
    platform: 'ios',
    app_name: 'Test App',
    app_id: '123',
    developer: 'TestCo',
    rating: 4.5,
    review_count: 1000,
    description: 'Test app description',
    category: 'Tools',
    price: 'Free',
  },
  {
    platform: 'android',
    app_name: 'Android App',
    app_id: '456',
    developer: 'AndroidCo',
    rating: 4.2,
    review_count: 500,
    description: 'Android app',
    category: 'Tools',
    price: 'Free',
  },
  {
    platform: 'web',
    app_name: 'Web Tool',
    app_id: 'web123',
    developer: 'WebCo',
    rating: 4.0,
    review_count: 200,
    description: 'Web tool',
    category: 'Online Tool',
    price: '$9/mo',
  },
];

describe('Concept Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetOpenAIInstance();
  });

  describe('generateConcepts', () => {
    it('returns array of concept ideas', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                concepts: [
                  {
                    name: 'QualityPro',
                    one_liner: 'The quality-first tool',
                    platform_recommendation: 'web',
                    platform_reasoning: 'Web allows faster iteration',
                    business_model: 'b2c',
                    gap_thesis: 'Focus on quality',
                    mvp_spec: {
                      must_haves: ['Quality preview'],
                      non_goals: ['Mobile app'],
                      differentiator: 'Quality focus',
                      pricing_model: 'Freemium',
                      success_criteria: ['100 users'],
                    },
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

      const concepts = await generateConcepts(
        mockGaps,
        mockClusters,
        mockAppStoreResults,
        'test tool'
      );

      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts[0]).toHaveProperty('name');
      expect(concepts[0]).toHaveProperty('one_liner');
      expect(concepts[0]).toHaveProperty('platform_recommendation');
      expect(concepts[0]).toHaveProperty('mvp_spec');
    });

    it('validates platform recommendations', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                concepts: [
                  {
                    name: 'Test',
                    platform_recommendation: 'web',
                    business_model: 'b2c',
                    mvp_spec: {},
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

      const concepts = await generateConcepts(mockGaps, mockClusters, mockAppStoreResults, 'test');

      const validPlatforms = ['web', 'mobile', 'hybrid'];
      concepts.forEach(concept => {
        expect(validPlatforms).toContain(concept.platform_recommendation);
      });
    });

    it('analyzes platform saturation', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                concepts: [],
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

      await generateConcepts(mockGaps, mockClusters, mockAppStoreResults, 'test');

      expect(mockCreate).toHaveBeenCalled();
      const prompt = mockCreate.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain('PLATFORM SATURATION');
      expect(prompt).toContain('iOS apps');
      expect(prompt).toContain('Android apps');
      expect(prompt).toContain('Web tools');
    });

    it('includes metrics for each concept', async () => {
      delete process.env.OPENAI_API_KEY;

      const concepts = await generateConcepts(mockGaps, mockClusters, mockAppStoreResults, 'test');

      concepts.forEach(concept => {
        expect(concept).toHaveProperty('metrics');
        expect(concept.metrics).toHaveProperty('cpc_low');
        expect(concept.metrics).toHaveProperty('cpc_expected');
        expect(concept.metrics).toHaveProperty('cpc_high');
        expect(concept.metrics).toHaveProperty('cac_low');
        expect(concept.metrics).toHaveProperty('tam_low');
        expect(concept.metrics).toHaveProperty('implementation_difficulty');
        expect(concept.metrics).toHaveProperty('opportunity_score');
      });
    });

    it('adjusts metrics for B2B vs B2C', async () => {
      delete process.env.OPENAI_API_KEY;

      const concepts = await generateConcepts(mockGaps, mockClusters, mockAppStoreResults, 'test');

      // Mock generates B2C by default
      const b2cConcept = concepts.find(c => c.business_model === 'b2c');
      if (b2cConcept?.metrics) {
        // B2C should have lower CAC than B2B
        expect(b2cConcept.metrics.cac_expected).toBeLessThan(100);
      }
    });

    it('includes MVP spec with all required fields', async () => {
      delete process.env.OPENAI_API_KEY;

      const concepts = await generateConcepts(mockGaps, mockClusters, mockAppStoreResults, 'test');

      concepts.forEach(concept => {
        expect(concept.mvp_spec).toHaveProperty('must_haves');
        expect(concept.mvp_spec).toHaveProperty('non_goals');
        expect(concept.mvp_spec).toHaveProperty('differentiator');
        expect(concept.mvp_spec).toHaveProperty('pricing_model');
        expect(concept.mvp_spec).toHaveProperty('success_criteria');
        expect(Array.isArray(concept.mvp_spec.must_haves)).toBe(true);
        expect(Array.isArray(concept.mvp_spec.non_goals)).toBe(true);
        expect(Array.isArray(concept.mvp_spec.success_criteria)).toBe(true);
      });
    });

    it('uses mock data when API key is not set', async () => {
      delete process.env.OPENAI_API_KEY;

      const concepts = await generateConcepts(mockGaps, mockClusters, mockAppStoreResults, 'test');

      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThan(0);
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

      const concepts = await generateConcepts(mockGaps, mockClusters, mockAppStoreResults, 'test');

      // Should fallback to mock data
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThan(0);
    });

    it('handles empty gaps gracefully', async () => {
      delete process.env.OPENAI_API_KEY;

      const concepts = await generateConcepts([], [], [], 'test');

      expect(Array.isArray(concepts)).toBe(true);
    });

    it('validates business models', async () => {
      delete process.env.OPENAI_API_KEY;

      const concepts = await generateConcepts(mockGaps, mockClusters, mockAppStoreResults, 'test');

      const validModels = ['b2b', 'b2c', 'b2b2c'];
      concepts.forEach(concept => {
        expect(validModels).toContain(concept.business_model);
      });
    });

    it('recommends less saturated platforms', async () => {
      delete process.env.OPENAI_API_KEY;

      // More web tools than mobile apps
      const webHeavyApps: AppStoreResult[] = [
        ...Array(10).fill({ ...mockAppStoreResults[2], platform: 'web' }),
        ...Array(2).fill({ ...mockAppStoreResults[0], platform: 'ios' }),
      ];

      const concepts = await generateConcepts(mockGaps, mockClusters, webHeavyApps, 'test');

      // Should recommend mobile since web is saturated
      expect(['mobile', 'hybrid']).toContain(concepts[0].platform_recommendation);
    });

    it('includes gap thesis from top gaps', async () => {
      delete process.env.OPENAI_API_KEY;

      const concepts = await generateConcepts(mockGaps, mockClusters, mockAppStoreResults, 'test');

      concepts.forEach(concept => {
        expect(concept.gap_thesis).toBeTruthy();
        expect(typeof concept.gap_thesis).toBe('string');
      });
    });
  });
});

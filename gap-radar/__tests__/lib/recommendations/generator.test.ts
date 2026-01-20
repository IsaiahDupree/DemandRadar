/**
 * Tests for Build Recommendation Generator
 * Feature: BUILD-002
 */

import {
  generateRecommendations,
  type MarketSignals,
  type BuildRecommendation,
  resetOpenAIInstance,
} from '@/lib/recommendations/generator';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  recommendations: [
                    {
                      product_name: 'AI Writing Assistant Pro',
                      product_idea: 'A specialized AI writing tool focused on blog content with SEO optimization',
                      product_type: 'saas',
                      tagline: 'Write better blog posts faster',
                      target_audience: 'Content marketers and bloggers',
                      target_persona: {
                        name: 'Marketing Manager Mary',
                        role: 'Content Marketing Manager',
                        pain_points: ['Takes too long to write quality content', 'SEO is confusing'],
                        goals: ['Publish 10+ blog posts per month', 'Rank on first page of Google'],
                      },
                      pain_points: [
                        'Current tools produce generic content',
                        'Need better SEO suggestions',
                      ],
                      competitor_ads: [
                        {
                          advertiser: 'Jasper',
                          hook: 'Write 10x faster with AI',
                        },
                      ],
                      search_queries: ['ai blog writer', 'seo content tool'],
                      content_gaps: ['No good tutorials on AI + SEO together'],
                      recommended_hooks: [
                        'Finally, AI that understands SEO',
                        'Write blogs that actually rank',
                      ],
                      recommended_channels: ['Google Ads', 'Content marketing', 'SEO blogs'],
                      estimated_cac_range: '$5-$15',
                      pricing_suggestion: 'Freemium: Free tier + $29/mo Pro',
                      confidence_score: 82,
                      reasoning: 'High demand signals across multiple sources',
                      risks: ['Competitive market', 'Need strong SEO differentiator'],
                    },
                    {
                      product_name: 'ContentFlow',
                      product_idea: 'Workflow automation for content teams',
                      product_type: 'saas',
                      tagline: 'Streamline your content operations',
                      target_audience: 'Content teams at B2B companies',
                      target_persona: {
                        name: 'Content Director Dan',
                        role: 'Director of Content',
                        pain_points: ['Hard to manage multiple writers', 'No visibility into pipeline'],
                        goals: ['Scale content production', 'Maintain quality'],
                      },
                      pain_points: ['No good project management for content', 'Writers miss deadlines'],
                      competitor_ads: [],
                      search_queries: ['content workflow tool', 'editorial calendar software'],
                      content_gaps: ['Integration guides for content teams'],
                      recommended_hooks: ['Never miss a content deadline', 'Scale content without chaos'],
                      recommended_channels: ['LinkedIn Ads', 'Content marketing'],
                      estimated_cac_range: '$150-$300',
                      pricing_suggestion: '$99/mo per team',
                      confidence_score: 75,
                      reasoning: 'Growing B2B need but less competition',
                      risks: ['Longer sales cycle', 'Need to prove ROI'],
                    },
                    {
                      product_name: 'SEO Brief Generator',
                      product_idea: 'AI-powered tool that generates SEO content briefs',
                      product_type: 'tool',
                      tagline: 'Perfect content briefs in 60 seconds',
                      target_audience: 'SEO agencies and in-house SEO teams',
                      target_persona: {
                        name: 'SEO Specialist Sam',
                        role: 'SEO Specialist',
                        pain_points: ['Creating briefs takes hours', 'Writers dont follow SEO guidelines'],
                        goals: ['Create better briefs faster', 'Improve content quality'],
                      },
                      pain_points: ['Manual brief creation is tedious', 'Hard to scale SEO content'],
                      competitor_ads: [],
                      search_queries: ['seo content brief', 'content brief template'],
                      content_gaps: ['How to write SEO briefs at scale'],
                      recommended_hooks: ['Stop wasting time on briefs', 'SEO briefs writers actually follow'],
                      recommended_channels: ['SEO communities', 'Reddit r/SEO'],
                      estimated_cac_range: '$3-$8',
                      pricing_suggestion: 'Pay per brief: $2-5 each',
                      confidence_score: 88,
                      reasoning: 'Clear pain point with weak competition',
                      risks: ['Niche market size'],
                    },
                  ],
                }),
              },
            },
          ],
        }),
      },
    },
  }));
});

describe('generateRecommendations', () => {
  beforeEach(() => {
    resetOpenAIInstance();
  });

  it('should generate 3-5 product recommendations from market signals', async () => {
    const signals: MarketSignals = {
      niche: 'ai-writing-tools',
      pain_points: [
        { text: 'Current tools produce generic content', frequency: 45 },
        { text: 'Need better SEO integration', frequency: 32 },
      ],
      competitor_ads: [
        {
          advertiser: 'Jasper',
          headline: 'Write 10x faster with AI',
          run_days: 120,
        },
        {
          advertiser: 'Copy.ai',
          headline: 'AI copywriting for marketers',
          run_days: 90,
        },
      ],
      search_queries: [
        { query: 'ai blog writer', volume: 12500 },
        { query: 'seo content tool', volume: 8900 },
      ],
      content_gaps: ['No good tutorials on AI + SEO together'],
      demand_score: 78,
    };

    const recommendations = await generateRecommendations(signals);

    expect(recommendations).toHaveLength(3);
    expect(recommendations[0].product_name).toBeTruthy();
    expect(recommendations[0].product_type).toBeTruthy();
  });

  it('should include required fields in each recommendation', async () => {
    const signals: MarketSignals = {
      niche: 'project-management',
      pain_points: [],
      competitor_ads: [],
      search_queries: [],
      content_gaps: [],
      demand_score: 50,
    };

    const recommendations = await generateRecommendations(signals);

    recommendations.forEach((rec) => {
      expect(rec).toHaveProperty('product_name');
      expect(rec).toHaveProperty('product_idea');
      expect(rec).toHaveProperty('product_type');
      expect(rec).toHaveProperty('tagline');
      expect(rec).toHaveProperty('target_audience');
      expect(rec).toHaveProperty('target_persona');
      expect(rec).toHaveProperty('pain_points');
      expect(rec).toHaveProperty('recommended_hooks');
      expect(rec).toHaveProperty('recommended_channels');
      expect(rec).toHaveProperty('confidence_score');
      expect(rec).toHaveProperty('reasoning');
      expect(rec).toHaveProperty('risks');
    });
  });

  it('should include target persona with required fields', async () => {
    const signals: MarketSignals = {
      niche: 'email-marketing',
      pain_points: [],
      competitor_ads: [],
      search_queries: [],
      content_gaps: [],
      demand_score: 65,
    };

    const recommendations = await generateRecommendations(signals);

    recommendations.forEach((rec) => {
      expect(rec.target_persona).toHaveProperty('name');
      expect(rec.target_persona).toHaveProperty('role');
      expect(rec.target_persona).toHaveProperty('pain_points');
      expect(rec.target_persona).toHaveProperty('goals');
      expect(Array.isArray(rec.target_persona.pain_points)).toBe(true);
      expect(Array.isArray(rec.target_persona.goals)).toBe(true);
    });
  });

  it('should return valid product types', async () => {
    const signals: MarketSignals = {
      niche: 'api-tools',
      pain_points: [],
      competitor_ads: [],
      search_queries: [],
      content_gaps: [],
      demand_score: 70,
    };

    const validTypes = ['saas', 'tool', 'api', 'marketplace', 'content', 'service', 'plugin'];
    const recommendations = await generateRecommendations(signals);

    recommendations.forEach((rec) => {
      expect(validTypes).toContain(rec.product_type);
    });
  });

  it('should have confidence scores between 0-100', async () => {
    const signals: MarketSignals = {
      niche: 'analytics-tools',
      pain_points: [],
      competitor_ads: [],
      search_queries: [],
      content_gaps: [],
      demand_score: 85,
    };

    const recommendations = await generateRecommendations(signals);

    recommendations.forEach((rec) => {
      expect(rec.confidence_score).toBeGreaterThanOrEqual(0);
      expect(rec.confidence_score).toBeLessThanOrEqual(100);
    });
  });

  it('should include marketing recommendations', async () => {
    const signals: MarketSignals = {
      niche: 'crm-tools',
      pain_points: [],
      competitor_ads: [],
      search_queries: [],
      content_gaps: [],
      demand_score: 72,
    };

    const recommendations = await generateRecommendations(signals);

    recommendations.forEach((rec) => {
      expect(Array.isArray(rec.recommended_hooks)).toBe(true);
      expect(rec.recommended_hooks.length).toBeGreaterThan(0);
      expect(Array.isArray(rec.recommended_channels)).toBe(true);
      expect(rec.recommended_channels.length).toBeGreaterThan(0);
      expect(rec.estimated_cac_range).toBeTruthy();
      expect(rec.pricing_suggestion).toBeTruthy();
    });
  });

  it('should handle high demand scores with higher confidence', async () => {
    const highDemandSignals: MarketSignals = {
      niche: 'high-demand-niche',
      pain_points: [
        { text: 'Major pain point', frequency: 100 },
        { text: 'Another pain point', frequency: 80 },
      ],
      competitor_ads: [
        { advertiser: 'Competitor1', headline: 'Test', run_days: 200 },
        { advertiser: 'Competitor2', headline: 'Test', run_days: 150 },
      ],
      search_queries: [
        { query: 'keyword1', volume: 50000 },
        { query: 'keyword2', volume: 30000 },
      ],
      content_gaps: ['Gap1', 'Gap2'],
      demand_score: 95,
    };

    const recommendations = await generateRecommendations(highDemandSignals);

    // With high demand signals, confidence should generally be higher
    const avgConfidence =
      recommendations.reduce((sum, rec) => sum + rec.confidence_score, 0) /
      recommendations.length;

    expect(avgConfidence).toBeGreaterThan(60);
  });

  it('should provide reasoning for each recommendation', async () => {
    const signals: MarketSignals = {
      niche: 'test-niche',
      pain_points: [],
      competitor_ads: [],
      search_queries: [],
      content_gaps: [],
      demand_score: 50,
    };

    const recommendations = await generateRecommendations(signals);

    recommendations.forEach((rec) => {
      expect(rec.reasoning).toBeTruthy();
      expect(typeof rec.reasoning).toBe('string');
      expect(rec.reasoning.length).toBeGreaterThan(10);
    });
  });

  it('should include risks array', async () => {
    const signals: MarketSignals = {
      niche: 'test-niche',
      pain_points: [],
      competitor_ads: [],
      search_queries: [],
      content_gaps: [],
      demand_score: 50,
    };

    const recommendations = await generateRecommendations(signals);

    recommendations.forEach((rec) => {
      expect(Array.isArray(rec.risks)).toBe(true);
    });
  });
});

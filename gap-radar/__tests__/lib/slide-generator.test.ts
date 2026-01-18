/**
 * Tests for Slide Deck Generator
 *
 * Validates module exports and type definitions
 * Full integration tests are in __tests__/integration/slide-export.test.ts
 */

import * as SlideGenerator from '@/lib/reports/slide-generator';

describe('Slide Deck Generator Module', () => {
  describe('exports', () => {
    it('should export generateSlides function', () => {
      expect(SlideGenerator.generateSlides).toBeDefined();
      expect(typeof SlideGenerator.generateSlides).toBe('function');
    });

    it('should have correct function signature', () => {
      // Type check - this will fail at compile time if types are wrong
      const fn: typeof SlideGenerator.generateSlides = SlideGenerator.generateSlides;
      expect(fn).toBeDefined();
    });
  });

  describe('types', () => {
    it('should accept valid options', () => {
      const validOptions: SlideGenerator.SlideGeneratorOptions = {
        includeCharts: true,
        brandColor: '#3b82f6',
        logoUrl: 'https://example.com/logo.png',
      };

      expect(validOptions).toBeDefined();
    });

    it('should accept minimal options', () => {
      const minimalOptions: SlideGenerator.SlideGeneratorOptions = {};
      expect(minimalOptions).toBeDefined();
    });
  });
});

// Mock report data for reference (used in integration tests)
const mockReportData = {
  run: {
    id: 'test-run-123',
    project_id: 'test-project-456',
    niche_query: 'AI productivity tools for writers',
    seed_terms: ['AI writing', 'content assistant'],
    competitors: ['Jasper', 'Copy.ai'],
    status: 'complete',
    started_at: new Date('2026-01-01'),
    finished_at: new Date('2026-01-02'),
    scores: {
      opportunity_score: 82,
      confidence: 0.85,
    },
  },
  summary: {
    nicheName: 'AI productivity tools for writers',
    opportunityScore: 82,
    confidence: 0.85,
    topGaps: [
      { title: 'Better real-time collaboration', type: 'product', score: 85 },
      { title: 'Transparent pricing model', type: 'pricing', score: 78 },
      { title: 'Writing style consistency', type: 'feature', score: 72 },
    ],
    platformRecommendation: {
      platform: 'web',
      reasoning: 'Web-first approach due to content creation workflows',
    },
  },
  paidMarket: {
    topAdvertisers: [
      { name: 'Jasper AI', adCount: 45, avgLongevity: 127 },
      { name: 'Copy.ai', adCount: 32, avgLongevity: 89 },
    ],
    topAngles: [
      { angle: '10x your content output', frequency: 25, examples: ['Create 10x more content', 'Scale your content'] },
      { angle: 'Never stare at blank page', frequency: 18, examples: ['Beat writer\'s block', 'Always know what to write'] },
    ],
    longestRunning: [
      { advertiser: 'Jasper AI', creative: 'AI writing assistant for teams', daysRunning: 180, firstSeen: '2025-07-01' },
    ],
    offerPatterns: {
      pricing: ['Free trial', '7-day money back'],
      trials: ['14-day free trial', 'No credit card required'],
      guarantees: ['100% money back guarantee'],
    },
  },
  reddit: {
    topObjections: [
      { objection: 'Output sounds too robotic', frequency: 45, intensity: 0.8, examples: ['Sounds like a bot wrote it'] },
      { objection: 'Expensive for solo creators', frequency: 32, intensity: 0.7, examples: ['Too pricey for freelancers'] },
    ],
    topDesiredFeatures: [
      { feature: 'Team collaboration features', frequency: 28, examples: ['Need real-time co-editing'] },
    ],
    pricingFriction: [
      { quote: 'Great tool but $99/mo is too steep for solo creators', source: 'r/freelanceWriters', score: 127 },
    ],
    trustFriction: [
      { quote: 'Worried about plagiarism detection', source: 'r/contentmarketing', score: 89 },
    ],
    switchingTriggers: ['Pricing too high', 'Limited customization'],
  },
  platformGap: {
    ios: { saturationScore: 35, topApps: [] },
    android: { saturationScore: 28, topApps: [] },
    web: { saturationScore: 72, topCompetitors: [] },
    recommendation: {
      platform: 'web',
      rationale: 'Web-first due to workflow integration needs',
    },
  },
  gaps: [],
  economics: {
    cpc: { low: 1.2, expected: 3.5, high: 8.0 },
    cac: { low: 25, expected: 65, high: 180 },
    tam: { low: 500000, expected: 2000000, high: 8000000, assumptions: ['Content creators market', 'Digital marketing professionals'] },
    budgetScenarios: {
      spend1k: { reach: 285, conversions: 15, cost: 1000 },
      spend10k: { reach: 2857, conversions: 153, cost: 10000 },
    },
  },
  buildability: {
    implementationDifficulty: 58,
    timeToMVP: 'M',
    humanTouchLevel: 'medium',
    autonomousSuitability: 'high',
    riskFlags: ['AI governance and transparency requirements'],
  },
  ugc: {
    topCreatives: [],
    trendSignals: { hashtags: [], sounds: [] },
    creativePatterns: { hooks: [], formats: [], proofTypes: [], ctaStyles: [] },
    recommendations: {
      hooks: ['Stop paying $99/mo for AI writing when you can...'],
      scripts: ['Hook → Problem → Solution → CTA'],
      shotList: ['Opening: frustrated writer at desk'],
    },
  },
  actionPlan: {
    sevenDayWins: ['Launch landing page with collaboration focus', 'Create 3 ad tests', 'Set up email capture'],
    thirtyDayRoadmap: [
      { week: 1, tasks: ['Validate demand', 'Run ad tests'] },
      { week: 2, tasks: ['Build MVP', 'Interview users'] },
    ],
    adTestConcepts: [
      { concept: 'Collaboration-first AI writing', angle: 'Teams need real-time editing', copy: 'Write together in real-time', cta: 'Start Free Trial' },
    ],
    landingPageStructure: {
      hero: 'AI Writing Assistant with Real-Time Collaboration',
      benefits: ['No more robotic output', 'No more expensive solo plans'],
      cta: 'Start Free Trial',
    },
    topKeywords: ['ai writing', 'content assistant', 'collaboration'],
  },
};


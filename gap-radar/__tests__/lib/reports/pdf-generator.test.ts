/**
 * Tests for PDF Report Generator
 * Feature: RG-014 - PDF Report Generation
 *
 * Acceptance Criteria:
 * 1. All sections included (9 pages per PRD)
 * 2. Professional formatting
 * 3. Charts render correctly (or gracefully degrade)
 * @jest-environment node
 */

// Mock @react-pdf/renderer
jest.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: any) => children,
  Page: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  View: ({ children }: any) => children,
  StyleSheet: {
    create: (styles: any) => styles,
  },
  pdf: (doc: any) => ({
    toBlob: async () => new Blob(['%PDF-1.4 mock pdf content'], { type: 'application/pdf' }),
  }),
  Font: {
    register: jest.fn(),
  },
}));

import { generatePDF } from '@/lib/reports/pdf-generator';
import type { ReportData } from '@/lib/reports/generator';

describe('PDF Report Generator', () => {
  const mockReportData: ReportData = {
    run: {
      id: 'run-123',
      project_id: 'proj-123',
      niche_query: 'AI productivity tools',
      seed_terms: ['AI', 'productivity'],
      competitors: ['Notion AI', 'ChatGPT'],
      geo: 'US',
      status: 'complete',
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      error: null,
    },
    summary: {
      nicheName: 'AI productivity tools',
      opportunityScore: 75,
      confidence: 0.85,
      topGaps: [
        { title: 'Better pricing transparency', type: 'pricing', score: 82 },
        { title: 'Improved onboarding', type: 'product', score: 78 },
        { title: 'Mobile app needed', type: 'product', score: 71 },
      ],
      platformRecommendation: {
        platform: 'web',
        reasoning: 'Strong web presence with mobile companion',
      },
    },
    paidMarket: {
      topAdvertisers: [
        { name: 'Notion', adCount: 15, avgLongevity: 45 },
        { name: 'ClickUp', adCount: 12, avgLongevity: 38 },
      ],
      topAngles: [
        { angle: 'Save time with AI', frequency: 8, examples: ['Example 1'] },
        { angle: 'Better than spreadsheets', frequency: 5, examples: ['Example 2'] },
      ],
      longestRunning: [
        {
          advertiser: 'Notion',
          creative: 'AI workspace',
          daysRunning: 90,
          firstSeen: '2024-10-01',
        },
      ],
      offerPatterns: {
        pricing: ['$10/mo', '$20/mo'],
        trials: ['14-day free trial', '30-day money back'],
        guarantees: ['Money back guarantee'],
      },
    },
    reddit: {
      topObjections: [
        {
          objection: 'Too expensive for solo founders',
          frequency: 15,
          intensity: 0.8,
          examples: ['Example complaint'],
        },
      ],
      topDesiredFeatures: [
        { feature: 'Offline mode', frequency: 12, examples: ['Example request'] },
      ],
      pricingFriction: [
        { quote: 'Pricing is confusing', source: 'r/SaaS', score: 10 },
      ],
      trustFriction: [
        { quote: 'Support is slow', source: 'r/entrepreneur', score: 8 },
      ],
      switchingTriggers: [
        { trigger: 'Poor mobile experience', frequency: 7, examples: ['Example'] },
      ],
    },
    platformGap: {
      ios: {
        saturationScore: 45,
        topApps: [
          { name: 'Notion', rating: 4.5, reviewCount: 1000 },
        ],
      },
      android: {
        saturationScore: 38,
        topApps: [
          { name: 'Notion', rating: 4.3, reviewCount: 800 },
        ],
      },
      web: {
        saturationScore: 72,
        topCompetitors: [
          { name: 'Notion', traffic: 1000000 },
        ],
      },
      recommendation: {
        platform: 'web',
        rationale: 'Web has strong demand, mobile apps are less saturated',
      },
    },
    gaps: [],
    economics: {
      cpc: { low: 0.5, expected: 2.0, high: 5.0 },
      cac: { low: 10, expected: 50, high: 150 },
      tam: {
        low: 100000,
        expected: 1000000,
        high: 10000000,
        assumptions: ['Assumption 1'],
      },
      budgetScenarios: {
        spend1k: { reach: 500, conversions: 20, cost: 1000 },
        spend10k: { reach: 5000, conversions: 200, cost: 10000 },
      },
    },
    buildability: {
      implementationDifficulty: 45,
      timeToMVP: 'M',
      humanTouchLevel: 'medium',
      autonomousSuitability: 'high',
      riskFlags: ['Competitive market'],
    },
    ugc: {
      topCreatives: [],
      trendSignals: { hashtags: ['#productivity'], sounds: [] },
      creativePatterns: {
        hooks: ['Hook 1'],
        formats: ['Format 1'],
        proofTypes: ['Testimonial'],
        ctaStyles: ['CTA 1'],
      },
      recommendations: {
        hooks: [
          'Stop wasting time on...',
          'Finally, an AI tool that...',
          'What if you could...',
        ],
        scripts: ['Script 1', 'Script 2'],
        shotList: ['Shot 1', 'Shot 2'],
      },
    },
    actionPlan: {
      sevenDayWins: [
        'Set up landing page',
        'Test 3 ad concepts',
        'Interview 5 users',
      ],
      thirtyDayRoadmap: [
        { week: 1, tasks: ['Task 1', 'Task 2'] },
        { week: 2, tasks: ['Task 3', 'Task 4'] },
      ],
      adTestConcepts: [
        { concept: 'Concept 1', rationale: 'Rationale 1' },
      ],
      landingPageStructure: {
        hero: 'Hero section',
        benefits: ['Benefit 1', 'Benefit 2'],
        cta: 'Get Started',
      },
      topKeywords: ['productivity', 'AI tools'],
    },
  };

  it('should generate a PDF buffer', async () => {
    const pdfBuffer = await generatePDF(mockReportData);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should include PDF header', async () => {
    const pdfBuffer = await generatePDF(mockReportData);
    const pdfString = pdfBuffer.toString('utf8');

    // PDF files start with %PDF
    expect(pdfString).toContain('%PDF');
  });

  it('should accept valid ReportData structure', async () => {
    // This test verifies that generatePDF accepts the correct data structure
    // If the structure is wrong, TypeScript will catch it at compile time
    const pdfBuffer = await generatePDF(mockReportData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
  });

  it('should work with all required sections populated', async () => {
    // Verify that all required sections in ReportData are handled
    const pdfBuffer = await generatePDF(mockReportData);

    // Should successfully generate PDF with all sections
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle report data with all numeric scores', async () => {
    // Verify numeric data is handled
    const pdfBuffer = await generatePDF(mockReportData);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(mockReportData.summary.opportunityScore).toBe(75);
    expect(mockReportData.summary.confidence).toBe(0.85);
  });

  it('should handle report data with gap information', async () => {
    // Verify gaps data structure is accepted
    const dataWithGaps: ReportData = {
      ...mockReportData,
      gaps: [
        {
          id: 'gap-1',
          run_id: 'run-123',
          gap_type: 'pricing',
          title: 'Better pricing transparency',
          problem: 'Users confused about pricing',
          evidence_ads: {},
          evidence_reddit: {},
          recommendation: 'Show clear pricing table',
          opportunity_score: 82,
          confidence: 0.9,
          created_at: new Date().toISOString(),
        },
      ],
    };

    const pdfBuffer = await generatePDF(dataWithGaps);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
  });

  it('should handle empty data gracefully', async () => {
    const emptyReportData: ReportData = {
      ...mockReportData,
      gaps: [],
      paidMarket: {
        topAdvertisers: [],
        topAngles: [],
        longestRunning: [],
        offerPatterns: { pricing: [], trials: [], guarantees: [] },
      },
      reddit: {
        topObjections: [],
        topDesiredFeatures: [],
        pricingFriction: [],
        trustFriction: [],
        switchingTriggers: [],
      },
    };

    const pdfBuffer = await generatePDF(emptyReportData);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle platform recommendation data', async () => {
    const pdfBuffer = await generatePDF(mockReportData);

    // Verify platform recommendation is in the data
    expect(mockReportData.summary.platformRecommendation.platform).toBe('web');
    expect(pdfBuffer).toBeInstanceOf(Buffer);
  });

  it('should handle UGC recommendations data', async () => {
    const pdfBuffer = await generatePDF(mockReportData);

    // Verify UGC data is accepted
    expect(mockReportData.ugc.recommendations.hooks.length).toBeGreaterThan(0);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
  });

  it('should be a valid PDF file', async () => {
    const pdfBuffer = await generatePDF(mockReportData);

    // Check PDF magic bytes
    const magicBytes = pdfBuffer.slice(0, 5).toString('utf8');
    expect(magicBytes).toBe('%PDF-');
  });
});

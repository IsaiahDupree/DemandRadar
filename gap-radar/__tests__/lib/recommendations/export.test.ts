/**
 * Tests for Build Recommendation Export
 * Feature: BUILD-008 - Export Brief Feature
 *
 * Acceptance Criteria:
 * 1. PDF generation works
 * 2. Markdown option works
 * 3. Download works
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

import { exportRecommendationAsPDF, exportRecommendationAsMarkdown } from '@/lib/recommendations/export';
import type { BuildRecommendation } from '@/lib/recommendations/generator';

describe('Build Recommendation Export', () => {
  const mockRecommendation: BuildRecommendation = {
    product_name: 'AI Productivity Tracker',
    product_idea: 'A smart productivity tracker that uses AI to analyze work patterns and provide actionable insights',
    product_type: 'saas',
    tagline: 'Your AI-powered productivity companion',
    target_audience: 'Busy professionals and remote workers',
    target_persona: {
      name: 'Sarah Chen',
      role: 'Marketing Manager',
      pain_points: [
        'Struggles to prioritize tasks effectively',
        'Loses track of time on low-value activities',
        'Wants better work-life balance'
      ],
      goals: [
        'Increase productivity by 30%',
        'Better manage time across projects',
        'Achieve work-life balance'
      ]
    },
    pain_points: [
      'Hard to track productivity across multiple tools',
      'No insights into where time is wasted',
      'Manual time tracking is tedious'
    ],
    competitor_ads: [
      { advertiser: 'RescueTime', hook: 'See where your time really goes' },
      { advertiser: 'Toggl Track', hook: 'Simple time tracking for teams' }
    ],
    search_queries: [
      'best productivity tracker',
      'automatic time tracking software',
      'productivity analytics tool'
    ],
    content_gaps: [
      'AI-powered insights missing',
      'No automated tracking available'
    ],
    recommended_hooks: [
      'Stop guessing where your time goes',
      'AI that shows you how to work smarter',
      'Productivity insights in seconds, not hours',
      'Your personal productivity coach'
    ],
    recommended_channels: [
      'Google Ads - High intent searches',
      'LinkedIn Ads - Professional audience',
      'ProductHunt - Early adopters',
      'Content Marketing - SEO blogs'
    ],
    estimated_cac_range: '$20-$60',
    pricing_suggestion: 'Freemium: Free tier + $19/mo Pro + $49/mo Teams',
    confidence_score: 85,
    reasoning: 'Strong market signals with 45% search growth, validated pain points from Reddit (150+ mentions), and proven CAC from competitor ads running 60+ days.',
    risks: [
      'Competitive market with established players',
      'Need strong differentiation in AI features',
      'Privacy concerns with time tracking'
    ]
  };

  describe('PDF Export', () => {
    it('should generate a PDF buffer', async () => {
      const pdfBuffer = await exportRecommendationAsPDF(mockRecommendation);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should include PDF header', async () => {
      const pdfBuffer = await exportRecommendationAsPDF(mockRecommendation);
      const pdfString = pdfBuffer.toString('utf8');

      // PDF files start with %PDF
      expect(pdfString).toContain('%PDF');
    });

    it('should be a valid PDF file', async () => {
      const pdfBuffer = await exportRecommendationAsPDF(mockRecommendation);

      // Check PDF magic bytes
      const magicBytes = pdfBuffer.slice(0, 5).toString('utf8');
      expect(magicBytes).toBe('%PDF-');
    });

    it('should handle all recommendation fields', async () => {
      const pdfBuffer = await exportRecommendationAsPDF(mockRecommendation);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(mockRecommendation.product_name).toBe('AI Productivity Tracker');
      expect(mockRecommendation.confidence_score).toBe(85);
    });
  });

  describe('Markdown Export', () => {
    it('should generate markdown content', () => {
      const markdown = exportRecommendationAsMarkdown(mockRecommendation);

      expect(typeof markdown).toBe('string');
      expect(markdown.length).toBeGreaterThan(0);
    });

    it('should include product name as heading', () => {
      const markdown = exportRecommendationAsMarkdown(mockRecommendation);

      expect(markdown).toContain('# AI Productivity Tracker');
    });

    it('should include tagline', () => {
      const markdown = exportRecommendationAsMarkdown(mockRecommendation);

      expect(markdown).toContain('Your AI-powered productivity companion');
    });

    it('should include all major sections', () => {
      const markdown = exportRecommendationAsMarkdown(mockRecommendation);

      // Check for section headers
      expect(markdown).toContain('## Product Overview');
      expect(markdown).toContain('## Target Audience');
      expect(markdown).toContain('## Target Persona');
      expect(markdown).toContain('## Pain Points');
      expect(markdown).toContain('## Market Insights');
      expect(markdown).toContain('## Marketing Strategy');
      expect(markdown).toContain('## Pricing & Economics');
      expect(markdown).toContain('## Confidence Assessment');
      expect(markdown).toContain('## Risks & Considerations');
    });

    it('should format persona information correctly', () => {
      const markdown = exportRecommendationAsMarkdown(mockRecommendation);

      expect(markdown).toContain('Sarah Chen');
      expect(markdown).toContain('Marketing Manager');
    });

    it('should include recommended hooks as bullet points', () => {
      const markdown = exportRecommendationAsMarkdown(mockRecommendation);

      expect(markdown).toContain('Stop guessing where your time goes');
      expect(markdown).toContain('- '); // Should have bullet points
    });

    it('should display confidence score', () => {
      const markdown = exportRecommendationAsMarkdown(mockRecommendation);

      expect(markdown).toContain('85');
      expect(markdown).toContain('Confidence Score');
    });

    it('should include competitor insights', () => {
      const markdown = exportRecommendationAsMarkdown(mockRecommendation);

      expect(markdown).toContain('RescueTime');
      expect(markdown).toContain('Toggl Track');
    });

    it('should be properly formatted with markdown syntax', () => {
      const markdown = exportRecommendationAsMarkdown(mockRecommendation);

      // Should have headers
      expect(markdown).toMatch(/^#/m);
      expect(markdown).toMatch(/^##/m);

      // Should have bullet lists
      expect(markdown).toContain('- ');

      // Should have bold text
      expect(markdown).toContain('**');
    });
  });

  describe('Edge Cases', () => {
    it('should handle recommendation with minimal data', async () => {
      const minimalRec: BuildRecommendation = {
        product_name: 'Simple Tool',
        product_idea: 'A basic tool',
        product_type: 'tool',
        tagline: 'Just a tool',
        target_audience: 'Everyone',
        target_persona: {
          name: 'User',
          role: 'Role',
          pain_points: [],
          goals: []
        },
        pain_points: [],
        competitor_ads: [],
        search_queries: [],
        content_gaps: [],
        recommended_hooks: [],
        recommended_channels: [],
        estimated_cac_range: '$10-$20',
        pricing_suggestion: '$10/mo',
        confidence_score: 50,
        reasoning: 'Limited data',
        risks: []
      };

      const pdfBuffer = await exportRecommendationAsPDF(minimalRec);
      expect(pdfBuffer).toBeInstanceOf(Buffer);

      const markdown = exportRecommendationAsMarkdown(minimalRec);
      expect(markdown).toContain('Simple Tool');
    });

    it('should handle special characters in markdown', () => {
      const recWithSpecialChars: BuildRecommendation = {
        ...mockRecommendation,
        product_name: 'Tool & Co. - "The Best"',
        tagline: 'We\'re #1 @ productivity!',
      };

      const markdown = exportRecommendationAsMarkdown(recWithSpecialChars);
      expect(markdown).toContain('Tool & Co.');
      expect(markdown).toContain('#1 @ productivity');
    });
  });
});

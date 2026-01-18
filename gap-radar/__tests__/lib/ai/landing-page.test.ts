/**
 * Tests for Landing Page Structure Generator (AI-007)
 *
 * Generates recommended landing page structure from market insights
 *
 * Acceptance Criteria:
 * - Section recommendations
 * - Copy suggestions
 * - Objection handling
 */

import { generateLandingPageStructure, type LandingPageStructure } from '@/lib/ai/landing-page';
import type { GapOpportunity } from '@/lib/ai/gap-generator';

describe('Landing Page Structure Generator (AI-007)', () => {
  const mockGaps: GapOpportunity[] = [
    {
      gap_type: 'product',
      title: 'Missing real-time collaboration',
      problem: 'Users want to collaborate in real-time but current tools are async-only',
      evidence_ads: [
        { id: 'ad-1', snippet: 'Real-time collaboration made easy' },
        { id: 'ad-2', snippet: 'Work together, see changes instantly' },
      ],
      evidence_reddit: [
        { id: 'reddit-1', snippet: 'Need real-time collaboration, current tools too slow' },
        { id: 'reddit-2', snippet: 'Why can\'t I see what my team is doing right now?' },
      ],
      recommendation: 'Add real-time collaboration with live cursors and presence',
      opportunity_score: 88,
      confidence: 0.92,
    },
    {
      gap_type: 'pricing',
      title: 'Pricing too complex',
      problem: 'Users confused by multiple tiers and hidden add-ons',
      evidence_ads: [
        { id: 'ad-3', snippet: 'Simple pricing, no surprises' },
      ],
      evidence_reddit: [
        { id: 'reddit-3', snippet: 'Pricing is so confusing, gave up' },
        { id: 'reddit-4', snippet: 'Why do they hide the real price?' },
      ],
      recommendation: 'Create transparent 2-tier pricing with all features listed',
      opportunity_score: 75,
      confidence: 0.85,
    },
    {
      gap_type: 'trust',
      title: 'Lack of credibility signals',
      problem: 'No testimonials or logos from known companies',
      evidence_ads: [
        { id: 'ad-4', snippet: 'Trusted by Fortune 500 companies' },
        { id: 'ad-5', snippet: 'Join 50,000+ teams' },
      ],
      evidence_reddit: [
        { id: 'reddit-5', snippet: 'Never heard of this, is it legit?' },
      ],
      recommendation: 'Add customer logos and specific testimonials with names/titles',
      opportunity_score: 68,
      confidence: 0.78,
    },
  ];

  const nicheQuery = 'project management tool';
  const valueProposition = 'Real-time project management that actually works';

  describe('Section recommendations', () => {
    it('should generate recommended sections for landing page', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      expect(structure.sections).toBeDefined();
      expect(Array.isArray(structure.sections)).toBe(true);
      expect(structure.sections.length).toBeGreaterThan(0);
    });

    it('should include standard landing page sections', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      const sectionTypes = structure.sections.map(s => s.type);

      // Should include critical sections
      expect(sectionTypes).toContain('hero');
      expect(sectionTypes.some(t => t === 'features' || t === 'benefits')).toBe(true);
      expect(sectionTypes.some(t => t === 'cta' || t === 'pricing')).toBe(true);
    });

    it('should provide section titles and descriptions', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      structure.sections.forEach((section) => {
        expect(section.type).toBeTruthy();
        expect(section.title).toBeTruthy();
        expect(section.description).toBeTruthy();
        expect(typeof section.order).toBe('number');
      });
    });

    it('should order sections logically', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      // Hero should be first
      expect(structure.sections[0].type).toBe('hero');

      // CTA or pricing should be near the end
      const lastSections = structure.sections.slice(-2);
      const hasCTAOrPricing = lastSections.some(
        s => s.type === 'cta' || s.type === 'pricing' || s.type === 'final_cta'
      );
      expect(hasCTAOrPricing).toBe(true);
    });

    it('should include recommended content for each section', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      structure.sections.forEach((section) => {
        if (section.content) {
          expect(Array.isArray(section.content)).toBe(true);
          expect(section.content.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Copy suggestions', () => {
    it('should generate headline suggestions', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      expect(structure.headline_suggestions).toBeDefined();
      expect(Array.isArray(structure.headline_suggestions)).toBe(true);
      expect(structure.headline_suggestions.length).toBeGreaterThan(0);
    });

    it('should generate subheadline suggestions', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      expect(structure.subheadline_suggestions).toBeDefined();
      expect(Array.isArray(structure.subheadline_suggestions)).toBe(true);
      expect(structure.subheadline_suggestions.length).toBeGreaterThan(0);
    });

    it('should generate CTA button copy suggestions', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      expect(structure.cta_suggestions).toBeDefined();
      expect(Array.isArray(structure.cta_suggestions)).toBe(true);
      expect(structure.cta_suggestions.length).toBeGreaterThan(0);
    });

    it('should tie copy to gaps and value proposition', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      const allCopy = [
        ...structure.headline_suggestions,
        ...structure.subheadline_suggestions,
        ...structure.cta_suggestions,
      ].join(' ').toLowerCase();

      // Should reference top gap (real-time collaboration)
      const referencesTopGap = allCopy.includes('real-time') ||
                                allCopy.includes('collaborate') ||
                                allCopy.includes('together');

      expect(referencesTopGap).toBe(true);
    });

    it('should provide benefit-focused copy', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      // Headlines should focus on benefits, not features
      const hasBenefitLanguage = structure.headline_suggestions.some(h =>
        h.toLowerCase().includes('save') ||
        h.toLowerCase().includes('faster') ||
        h.toLowerCase().includes('better') ||
        h.toLowerCase().includes('easy') ||
        h.toLowerCase().includes('simple')
      );

      expect(hasBenefitLanguage).toBe(true);
    });
  });

  describe('Objection handling', () => {
    it('should identify objections to address', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      expect(structure.objections).toBeDefined();
      expect(Array.isArray(structure.objections)).toBe(true);
      expect(structure.objections.length).toBeGreaterThan(0);
    });

    it('should provide objection and response for each', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      structure.objections.forEach((obj) => {
        expect(obj.objection).toBeTruthy();
        expect(obj.response).toBeTruthy();
        expect(obj.placement).toBeTruthy();
      });
    });

    it('should derive objections from gap evidence', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      const objectionText = structure.objections
        .map(o => o.objection + ' ' + o.response)
        .join(' ')
        .toLowerCase();

      // Should address pricing objection from gaps
      const addressesPricing = objectionText.includes('pricing') ||
                                objectionText.includes('price') ||
                                objectionText.includes('cost');

      // Or trust objection
      const addressesTrust = objectionText.includes('trust') ||
                              objectionText.includes('legit') ||
                              objectionText.includes('credib');

      expect(addressesPricing || addressesTrust).toBe(true);
    });

    it('should suggest where to place objection handling', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      structure.objections.forEach((obj) => {
        expect(obj.placement).toMatch(
          /hero|features|benefits|pricing|testimonials|faq|cta/i
        );
      });
    });

    it('should prioritize objections by gap score', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      // Top objection should relate to highest-scoring gap (real-time collaboration)
      const firstObjection = structure.objections[0];
      const relatedToTopGap = firstObjection.objection.toLowerCase().includes('real-time') ||
                               firstObjection.objection.toLowerCase().includes('collaborate') ||
                               firstObjection.response.toLowerCase().includes('real-time');

      expect(relatedToTopGap).toBe(true);
    });
  });

  describe('AI-007 Acceptance Criteria', () => {
    it('should generate section recommendations', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      expect(structure.sections).toBeDefined();
      expect(structure.sections.length).toBeGreaterThan(5);

      // Should have all critical sections
      const sectionTypes = structure.sections.map(s => s.type);
      expect(sectionTypes).toContain('hero');
      expect(sectionTypes.some(t => t === 'features' || t === 'benefits')).toBe(true);
    });

    it('should generate copy suggestions', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      expect(structure.headline_suggestions.length).toBeGreaterThanOrEqual(3);
      expect(structure.subheadline_suggestions.length).toBeGreaterThanOrEqual(3);
      expect(structure.cta_suggestions.length).toBeGreaterThanOrEqual(3);
    });

    it('should provide objection handling', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        valueProposition
      );

      expect(structure.objections.length).toBeGreaterThanOrEqual(3);

      structure.objections.forEach((obj) => {
        expect(obj.objection).toBeTruthy();
        expect(obj.response).toBeTruthy();
        expect(obj.placement).toBeTruthy();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty gaps array', async () => {
      const structure = await generateLandingPageStructure(
        [],
        nicheQuery,
        valueProposition
      );

      expect(structure.sections).toBeDefined();
      expect(structure.headline_suggestions).toBeDefined();
      expect(structure.objections).toBeDefined();
    });

    it('should handle missing value proposition', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        nicheQuery,
        ''
      );

      expect(structure.sections).toBeDefined();
      expect(structure.headline_suggestions.length).toBeGreaterThan(0);
    });

    it('should include niche context in all copy', async () => {
      const structure = await generateLandingPageStructure(
        mockGaps,
        'AI writing assistant',
        'Write better content faster'
      );

      const allText = JSON.stringify(structure).toLowerCase();
      const hasNicheContext = allText.includes('ai') ||
                               allText.includes('writing') ||
                               allText.includes('content');

      expect(hasNicheContext).toBe(true);
    });
  });
});

import { getDemoNiches, getDemoNiche, DEMO_NICHES } from '@/lib/demo/niches';

describe('Demo Niches', () => {
  describe('DEMO_NICHES', () => {
    it('should have at least 3 demo niches', () => {
      expect(DEMO_NICHES.length).toBeGreaterThanOrEqual(3);
    });

    it('each niche should have required fields', () => {
      DEMO_NICHES.forEach((niche) => {
        expect(niche).toHaveProperty('id');
        expect(niche).toHaveProperty('name');
        expect(niche).toHaveProperty('category');
        expect(niche).toHaveProperty('description');
        expect(niche).toHaveProperty('opportunityScore');
        expect(niche).toHaveProperty('confidence');
        expect(niche).toHaveProperty('preview');
      });
    });

    it('each niche preview should have required fields', () => {
      DEMO_NICHES.forEach((niche) => {
        expect(niche.preview).toHaveProperty('topGaps');
        expect(niche.preview).toHaveProperty('marketSnapshot');
        expect(niche.preview).toHaveProperty('topInsights');
        expect(niche.preview).toHaveProperty('platformRecommendation');

        expect(Array.isArray(niche.preview.topGaps)).toBe(true);
        expect(niche.preview.topGaps.length).toBeGreaterThan(0);

        expect(Array.isArray(niche.preview.topInsights)).toBe(true);
        expect(niche.preview.topInsights.length).toBeGreaterThan(0);
      });
    });

    it('opportunity scores should be between 0 and 100', () => {
      DEMO_NICHES.forEach((niche) => {
        expect(niche.opportunityScore).toBeGreaterThanOrEqual(0);
        expect(niche.opportunityScore).toBeLessThanOrEqual(100);
      });
    });

    it('confidence scores should be between 0 and 1', () => {
      DEMO_NICHES.forEach((niche) => {
        expect(niche.confidence).toBeGreaterThanOrEqual(0);
        expect(niche.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('getDemoNiches', () => {
    it('should return all demo niches', () => {
      const niches = getDemoNiches();
      expect(niches).toEqual(DEMO_NICHES);
      expect(niches.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getDemoNiche', () => {
    it('should return a niche by id', () => {
      const niche = getDemoNiche('demo-ai-writing-tools');
      expect(niche).toBeDefined();
      expect(niche?.id).toBe('demo-ai-writing-tools');
      expect(niche?.name).toBe('AI Writing Tools for Content Creators');
    });

    it('should return undefined for non-existent id', () => {
      const niche = getDemoNiche('non-existent-id');
      expect(niche).toBeUndefined();
    });
  });
});

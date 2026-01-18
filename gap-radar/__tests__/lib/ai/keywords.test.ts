/**
 * Tests for Keyword Recommendations (AI-008)
 *
 * Generates top keywords to target based on gap analysis
 *
 * Acceptance Criteria:
 * - Keywords ranked
 * - Intent classified
 * - Competition noted
 */

import { generateKeywordRecommendations, type KeywordRecommendation } from '@/lib/ai/keywords';
import type { GapOpportunity } from '@/lib/ai/gap-generator';

describe('Keyword Recommendations (AI-008)', () => {
  const mockGaps: GapOpportunity[] = [
    {
      gap_type: 'product',
      title: 'Missing API integration',
      problem: 'Users cannot integrate with other tools via API',
      evidence_ads: [
        { id: 'ad-1', snippet: 'Seamless API integration' },
        { id: 'ad-2', snippet: 'Connect with 100+ apps' },
      ],
      evidence_reddit: [
        { id: 'reddit-1', snippet: 'Need API access to automate workflows' },
        { id: 'reddit-2', snippet: 'No API = dealbreaker for me' },
      ],
      recommendation: 'Build REST API with webhooks',
      opportunity_score: 92,
      confidence: 0.95,
    },
    {
      gap_type: 'pricing',
      title: 'Expensive compared to alternatives',
      problem: 'Users mention pricing is 2-3x competitors',
      evidence_ads: [
        { id: 'ad-3', snippet: 'Affordable pricing starting at $9/month' },
      ],
      evidence_reddit: [
        { id: 'reddit-3', snippet: 'Too expensive, switching to competitor' },
        { id: 'reddit-4', snippet: 'Great product but not worth the price' },
      ],
      recommendation: 'Introduce $19/month starter plan',
      opportunity_score: 78,
      confidence: 0.88,
    },
    {
      gap_type: 'trust',
      title: 'Security concerns',
      problem: 'Users worried about data privacy and security',
      evidence_ads: [
        { id: 'ad-4', snippet: 'SOC 2 compliant, bank-level security' },
      ],
      evidence_reddit: [
        { id: 'reddit-5', snippet: 'Is my data safe? Any security certifications?' },
      ],
      recommendation: 'Get SOC 2 certification and display security badges',
      opportunity_score: 65,
      confidence: 0.82,
    },
  ];

  const nicheQuery = 'project management software';

  describe('Keywords ranked', () => {
    it('should generate keyword recommendations', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      expect(keywords).toBeDefined();
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
    });

    it('should rank keywords by opportunity score', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      expect(keywords.length).toBeGreaterThan(1);

      // Should be sorted by score (descending)
      for (let i = 1; i < keywords.length; i++) {
        expect(keywords[i - 1].score).toBeGreaterThanOrEqual(keywords[i].score);
      }
    });

    it('should include keyword and score for each recommendation', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      keywords.forEach((kw) => {
        expect(kw.keyword).toBeTruthy();
        expect(typeof kw.keyword).toBe('string');
        expect(typeof kw.score).toBe('number');
        expect(kw.score).toBeGreaterThanOrEqual(0);
        expect(kw.score).toBeLessThanOrEqual(100);
      });
    });

    it('should derive keywords from gaps and niche', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      const keywordText = keywords.map(k => k.keyword.toLowerCase()).join(' ');

      // Should reference project management
      const hasNiche = keywordText.includes('project') || keywordText.includes('management');

      // Should reference top gap (API integration)
      const hasTopGap = keywordText.includes('api') || keywordText.includes('integration');

      expect(hasNiche || hasTopGap).toBe(true);
    });

    it('should include long-tail keywords', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      // Some keywords should be longer (3+ words)
      const longTailKeywords = keywords.filter(k => k.keyword.split(' ').length >= 3);

      expect(longTailKeywords.length).toBeGreaterThan(0);
    });

    it('should include short-tail keywords', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      // Some keywords should be shorter (1-2 words)
      const shortTailKeywords = keywords.filter(k => k.keyword.split(' ').length <= 2);

      expect(shortTailKeywords.length).toBeGreaterThan(0);
    });
  });

  describe('Intent classified', () => {
    it('should classify keyword intent', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      keywords.forEach((kw) => {
        expect(kw.intent).toBeDefined();
        expect(kw.intent).toMatch(/^(informational|commercial|transactional|navigational)$/);
      });
    });

    it('should have transactional intent for product keywords', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      // Keywords like "buy X", "X pricing", "best X" should be transactional or commercial
      const commercialKeywords = keywords.filter(k =>
        k.keyword.toLowerCase().includes('pricing') ||
        k.keyword.toLowerCase().includes('best') ||
        k.keyword.toLowerCase().includes('alternative') ||
        k.keyword.toLowerCase().includes('vs')
      );

      if (commercialKeywords.length > 0) {
        commercialKeywords.forEach(kw => {
          expect(['commercial', 'transactional']).toContain(kw.intent);
        });
      }
    });

    it('should have informational intent for how-to keywords', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      // Keywords like "how to X" should be informational
      const infoKeywords = keywords.filter(k =>
        k.keyword.toLowerCase().includes('how to') ||
        k.keyword.toLowerCase().includes('what is') ||
        k.keyword.toLowerCase().includes('guide')
      );

      if (infoKeywords.length > 0) {
        infoKeywords.forEach(kw => {
          expect(kw.intent).toBe('informational');
        });
      }
    });
  });

  describe('Competition noted', () => {
    it('should note competition level for each keyword', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      keywords.forEach((kw) => {
        expect(kw.competition).toBeDefined();
        expect(kw.competition).toMatch(/^(low|medium|high)$/);
      });
    });

    it('should provide reasoning for competition level', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      keywords.forEach((kw) => {
        if (kw.competition_reason) {
          expect(typeof kw.competition_reason).toBe('string');
          expect(kw.competition_reason.length).toBeGreaterThan(0);
        }
      });
    });

    it('should have varied competition levels', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      if (keywords.length >= 5) {
        const competitionLevels = new Set(keywords.map(k => k.competition));

        // Should have some variety in competition levels
        expect(competitionLevels.size).toBeGreaterThan(1);
      }
    });

    it('should rank long-tail keywords with lower competition', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      const longTailKeywords = keywords.filter(k => k.keyword.split(' ').length >= 4);

      if (longTailKeywords.length > 0) {
        // Long-tail keywords typically have lower competition
        const lowCompKeywords = longTailKeywords.filter(k =>
          k.competition === 'low' || k.competition === 'medium'
        );

        expect(lowCompKeywords.length).toBeGreaterThan(0);
      }
    });
  });

  describe('AI-008 Acceptance Criteria', () => {
    it('should generate keywords ranked by score', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      expect(keywords.length).toBeGreaterThanOrEqual(10);

      // Verify ranking
      for (let i = 1; i < keywords.length; i++) {
        expect(keywords[i - 1].score).toBeGreaterThanOrEqual(keywords[i].score);
      }
    });

    it('should classify intent for all keywords', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      keywords.forEach((kw) => {
        expect(kw.intent).toMatch(/^(informational|commercial|transactional|navigational)$/);
      });
    });

    it('should note competition for all keywords', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      keywords.forEach((kw) => {
        expect(kw.competition).toMatch(/^(low|medium|high)$/);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty gaps array', async () => {
      const keywords = await generateKeywordRecommendations([], nicheQuery);

      expect(keywords).toBeDefined();
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
    });

    it('should handle generic niche query', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, 'software');

      expect(keywords).toBeDefined();
      expect(keywords.length).toBeGreaterThan(0);
    });

    it('should tie keywords to gap evidence', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      const keywordText = keywords.map(k => k.keyword.toLowerCase()).join(' ');

      // Should reference evidence from gaps (API, pricing, security)
      const referencesGaps = keywordText.includes('api') ||
                              keywordText.includes('price') ||
                              keywordText.includes('pricing') ||
                              keywordText.includes('security') ||
                              keywordText.includes('integration');

      expect(referencesGaps).toBe(true);
    });

    it('should include search volume estimates when available', async () => {
      const keywords = await generateKeywordRecommendations(mockGaps, nicheQuery);

      // Some keywords may have search volume
      const keywordsWithVolume = keywords.filter(k => k.search_volume !== undefined);

      // It's OK if none have volume (we may not have data), but if they do, check format
      if (keywordsWithVolume.length > 0) {
        keywordsWithVolume.forEach(kw => {
          expect(typeof kw.search_volume).toBe('number');
          expect(kw.search_volume).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });
});

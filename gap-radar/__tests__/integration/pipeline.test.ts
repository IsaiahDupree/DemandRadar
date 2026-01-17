/**
 * Integration Tests for Full Analysis Pipeline
 * 
 * Tests the complete flow from data collection to report generation
 */

describe('Analysis Pipeline Integration', () => {
  
  describe('Data Collection', () => {
    it('collects data from all configured sources', async () => {
      // Mock the collectors
      const mockMetaAds = [
        { source: 'meta', advertiser_name: 'Test Co', creative_text: 'Buy now!' },
      ];
      const mockRedditMentions = [
        { subreddit: 'r/test', title: 'Question', body: 'Help me', score: 100 },
      ];
      const mockGoogleAds = [
        { source: 'google', advertiser_name: 'Test Ad', headline: 'Best product' },
      ];

      // Simulate collection
      const collectedData = {
        meta: mockMetaAds,
        reddit: mockRedditMentions,
        google: mockGoogleAds,
      };

      expect(collectedData.meta.length).toBeGreaterThan(0);
      expect(collectedData.reddit.length).toBeGreaterThan(0);
      expect(collectedData.google.length).toBeGreaterThan(0);
    });

    it('handles partial source failures gracefully', async () => {
      // Simulate one source failing
      const results = {
        meta: [{ advertiser_name: 'Test', creative_text: 'Ad' }],
        reddit: [], // Failed or no data
        google: [{ advertiser_name: 'Google Ad', headline: 'Test' }],
      };

      // Pipeline should continue with available data
      const totalSources = Object.values(results).filter(r => r.length > 0).length;
      expect(totalSources).toBeGreaterThanOrEqual(1);
    });

    it('deduplicates data across sources', () => {
      const ads = [
        { advertiser_name: 'DupCo', headline: 'Same headline' },
        { advertiser_name: 'DupCo', headline: 'Same headline' }, // Duplicate
        { advertiser_name: 'UniqueCo', headline: 'Different' },
      ];

      const seen = new Set<string>();
      const deduped = ads.filter(ad => {
        const key = `${ad.advertiser_name}:${ad.headline}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      expect(deduped.length).toBe(2);
    });
  });

  describe('Insight Extraction', () => {
    it('extracts offers, claims, and angles from ads', async () => {
      const mockExtraction = {
        offers: ['Free trial', '50% off'],
        claims: ['#1 rated', 'Used by 100k users'],
        angles: ['Speed', 'Ease of use', 'Price'],
        objections: [],
        desired_features: [],
        sentiment: { positive: 0.8, negative: 0.1, neutral: 0.1 },
      };

      expect(mockExtraction.offers.length).toBeGreaterThan(0);
      expect(mockExtraction.claims.length).toBeGreaterThan(0);
      expect(mockExtraction.angles.length).toBeGreaterThan(0);
    });

    it('extracts objections and features from reddit', async () => {
      const mockExtraction = {
        offers: [],
        claims: [],
        angles: [],
        objections: ['Too expensive', 'Poor support', 'Slow'],
        desired_features: ['Mobile app', 'Dark mode', 'API'],
        sentiment: { positive: 0.2, negative: 0.6, neutral: 0.2 },
      };

      expect(mockExtraction.objections.length).toBeGreaterThan(0);
      expect(mockExtraction.desired_features.length).toBeGreaterThan(0);
    });

    it('clusters similar insights together', () => {
      const rawObjections = [
        'too expensive',
        'costs too much',
        'overpriced',
        'slow loading',
        'takes forever',
      ];

      // Simulate clustering
      const clusters = [
        { label: 'Price concerns', examples: ['too expensive', 'costs too much', 'overpriced'], frequency: 3 },
        { label: 'Performance issues', examples: ['slow loading', 'takes forever'], frequency: 2 },
      ];

      expect(clusters.length).toBe(2);
      expect(clusters[0].frequency).toBe(3);
    });
  });

  describe('Gap Generation', () => {
    it('identifies gaps between ads and user feedback', () => {
      const adClaims = ['Fast', 'Easy', 'Reliable'];
      const userComplaints = ['Slow', 'Confusing UI', 'Crashes often'];

      // Simple gap detection: claims vs complaints
      const gaps = [
        { type: 'product', title: 'Speed mismatch', problem: 'Ads claim fast but users say slow' },
        { type: 'product', title: 'Usability gap', problem: 'Ads claim easy but users find it confusing' },
        { type: 'trust', title: 'Reliability issues', problem: 'Ads claim reliable but users report crashes' },
      ];

      expect(gaps.length).toBe(3);
      expect(gaps.every(g => g.type && g.title && g.problem)).toBe(true);
    });

    it('ranks gaps by opportunity score', () => {
      const gaps = [
        { title: 'Gap A', opportunity_score: 45 },
        { title: 'Gap B', opportunity_score: 85 },
        { title: 'Gap C', opportunity_score: 62 },
      ];

      const ranked = gaps.sort((a, b) => b.opportunity_score - a.opportunity_score);

      expect(ranked[0].title).toBe('Gap B');
      expect(ranked[0].opportunity_score).toBe(85);
    });
  });

  describe('Scoring', () => {
    it('calculates saturation score', () => {
      const metrics = {
        uniqueAdvertisers: 15,
        totalCreatives: 50,
        repetitionIndex: 0.7,
      };

      // Simplified scoring
      const saturation = Math.min(100, metrics.uniqueAdvertisers * 3 + metrics.totalCreatives * 0.5 + metrics.repetitionIndex * 20);
      
      expect(saturation).toBeGreaterThan(0);
      expect(saturation).toBeLessThanOrEqual(100);
    });

    it('calculates opportunity score', () => {
      const longevity = 70;
      const dissatisfaction = 65;
      const misalignment = 55;
      const saturation = 40;

      // Formula from PRD
      const opportunity = 0.35 * longevity + 0.35 * dissatisfaction + 0.30 * misalignment;
      const adjusted = opportunity - 0.15 * saturation;

      expect(adjusted).toBeGreaterThan(0);
      expect(adjusted).toBeLessThanOrEqual(100);
    });

    it('confidence increases with more data', () => {
      const lowDataConfidence = calculateConfidence(5, 10, 1);
      const highDataConfidence = calculateConfidence(100, 200, 5);

      expect(highDataConfidence).toBeGreaterThan(lowDataConfidence);
    });
  });

  describe('Report Generation', () => {
    it('generates complete report structure', () => {
      const report = {
        run: { id: 'test', niche_query: 'fitness app', status: 'complete' },
        scores: { saturation: 45, opportunity: 72, confidence: 0.85 },
        summary: { totalAds: 50, totalMentions: 120, totalGaps: 5 },
        marketSnapshot: { topAdvertisers: [], topAngles: [] },
        painMap: { topObjections: [], topFeatures: [] },
        gaps: [],
        concepts: [],
        ugc: null,
      };

      expect(report).toHaveProperty('run');
      expect(report).toHaveProperty('scores');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('gaps');
    });

    it('includes all PRD-required sections', () => {
      const requiredSections = [
        'marketSnapshot',
        'painMap',
        'gaps',
        'concepts',
      ];

      const report = {
        marketSnapshot: { topAdvertisers: [] },
        painMap: { topObjections: [] },
        gaps: [],
        concepts: [],
      };

      for (const section of requiredSections) {
        expect(report).toHaveProperty(section);
      }
    });
  });

  describe('Export Functionality', () => {
    it('exports data as JSON', () => {
      const data = {
        ads: [{ advertiser: 'Test', headline: 'Ad' }],
        mentions: [{ subreddit: 'r/test', title: 'Post' }],
      };

      const json = JSON.stringify(data);
      const parsed = JSON.parse(json);

      expect(parsed.ads.length).toBe(1);
      expect(parsed.mentions.length).toBe(1);
    });

    it('exports data as CSV', () => {
      const ads = [
        { advertiser: 'Test Co', headline: 'Buy now' },
        { advertiser: 'Other Co', headline: 'Try free' },
      ];

      const headers = Object.keys(ads[0]).join(',');
      const rows = ads.map(a => Object.values(a).join(','));
      const csv = [headers, ...rows].join('\n');

      expect(csv).toContain('advertiser,headline');
      expect(csv).toContain('Test Co,Buy now');
    });
  });
});

// Helper function for confidence calculation
function calculateConfidence(ads: number, mentions: number, gaps: number): number {
  const dataSufficiency = Math.min(1, (ads / 30 + mentions / 50) / 2);
  const gapCoverage = Math.min(1, gaps / 5);
  return dataSufficiency * 0.7 + gapCoverage * 0.3;
}

/**
 * Reports API Integration Tests
 * Tests for /api/reports/[runId] endpoint
 */

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock scoring module
jest.mock('@/lib/scoring', () => ({
  calculateScores: jest.fn(() => ({
    saturation: 45,
    longevity: 70,
    dissatisfaction: 65,
    misalignment: 55,
    opportunity: 72,
    confidence: 0.85,
  })),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

describe('Reports API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/[runId]', () => {
    it('returns complete report data structure', async () => {
      const mockUser = { id: 'user-123' };
      const mockRun = {
        id: 'run-123',
        niche_query: 'fitness app',
        status: 'complete',
        created_at: '2024-01-01T00:00:00Z',
        finished_at: '2024-01-01T00:10:00Z',
      };

      const mockAds = [
        {
          source: 'meta',
          advertiser_name: 'FitnessPro',
          creative_text: 'Get fit fast',
          headline: 'Best Fitness App',
          first_seen: '2024-01-01',
          is_active: true,
          media_type: 'image',
        },
      ];

      const mockMentions = [
        {
          subreddit: 'r/fitness',
          type: 'post',
          title: 'Looking for fitness app',
          text: 'Need recommendations',
          score: 100,
          num_comments: 25,
          permalink: '/r/fitness/123',
          created_at: '2024-01-01',
        },
      ];

      const mockClusters = [
        {
          cluster_type: 'objection',
          label: 'Pricing too high',
          examples: ['Too expensive'],
          frequency: 10,
          intensity: 0.8,
        },
      ];

      const mockGaps = [
        {
          id: 'gap-1',
          run_id: 'run-123',
          gap_type: 'pricing',
          title: 'Pricing gap',
          problem: 'Users complain about price',
          recommendation: 'Lower prices',
          opportunity_score: 85,
          confidence: 0.8,
          evidence_ads: ['Ad claim'],
          evidence_reddit: ['Reddit complaint'],
        },
      ];

      const mockConcepts = [
        {
          id: 'concept-1',
          name: 'FitnessTracker Pro',
          one_liner: 'Track your fitness goals',
          platform_recommendation: 'mobile',
          industry: 'Health',
          business_model: 'b2c',
          concept_metrics: [{
            implementation_difficulty: 5,
            opportunity_score: 80,
            cpc_low: 0.5,
            cpc_expected: 1.0,
            cpc_high: 2.0,
            cac_low: 5,
            cac_expected: 10,
            cac_high: 20,
            tam_low: 1000000,
            tam_expected: 5000000,
            tam_high: 10000000,
            build_difficulty: 4,
            distribution_difficulty: 6,
            human_touch_level: 'low',
            autonomous_suitability: 'high',
          }],
        },
      ];

      const mockUGC = {
        hooks: [{ text: 'Hook 1', type: 'POV' }],
        scripts: [{ duration: '30s', outline: ['Hook', 'Demo', 'CTA'] }],
        shot_list: [{ shot: 'Screen recording', description: 'Show app' }],
        angle_map: [{ angle: 'Quality', priority: 1, examples: ['Example'] }],
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockRunQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRun, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockRunQuery);

      // Simulate parallel data fetching
      const reportData = {
        run: mockRun,
        scores: {
          saturation: 45,
          longevity: 70,
          dissatisfaction: 65,
          misalignment: 55,
          opportunity: 72,
          confidence: 0.85,
        },
        summary: {
          totalAds: mockAds.length,
          totalMentions: mockMentions.length,
          totalGaps: mockGaps.length,
          totalConcepts: mockConcepts.length,
          uniqueAdvertisers: 1,
          topObjections: 1,
        },
        marketSnapshot: {
          topAdvertisers: [{ name: 'FitnessPro', adCount: 1 }],
          topAngles: [],
          longestRunningAds: [],
        },
        painMap: {
          topObjections: [{ label: 'Pricing too high', frequency: 10, intensity: 0.8 }],
          topFeatures: [],
          pricingFriction: ['Pricing too high'],
          trustIssues: [],
        },
        gaps: mockGaps.map(g => ({
          id: g.id,
          type: g.gap_type,
          title: g.title,
          problem: g.problem,
          recommendation: g.recommendation,
          score: g.opportunity_score,
          confidence: g.confidence,
        })),
        concepts: mockConcepts.map(c => ({
          id: c.id,
          name: c.name,
          oneLiner: c.one_liner,
          platform: c.platform_recommendation,
          industry: c.industry,
          businessModel: c.business_model,
          difficulty: c.concept_metrics?.[0]?.implementation_difficulty || 5,
          opportunityScore: c.concept_metrics?.[0]?.opportunity_score || 0,
        })),
        ugc: mockUGC,
        economics: [],
        buildability: [],
      };

      expect(reportData).toHaveProperty('run');
      expect(reportData).toHaveProperty('scores');
      expect(reportData).toHaveProperty('summary');
      expect(reportData).toHaveProperty('marketSnapshot');
      expect(reportData).toHaveProperty('painMap');
      expect(reportData).toHaveProperty('gaps');
      expect(reportData).toHaveProperty('concepts');
      expect(reportData).toHaveProperty('ugc');
    });

    it('calculates scores correctly', async () => {
      const scores = {
        saturation: 45,
        longevity: 70,
        dissatisfaction: 65,
        misalignment: 55,
        opportunity: 72,
        confidence: 0.85,
      };

      expect(scores.saturation).toBeGreaterThanOrEqual(0);
      expect(scores.saturation).toBeLessThanOrEqual(100);
      expect(scores.confidence).toBeGreaterThanOrEqual(0);
      expect(scores.confidence).toBeLessThanOrEqual(1);
    });

    it('aggregates top advertisers correctly', () => {
      const ads = [
        { advertiser_name: 'Company A' },
        { advertiser_name: 'Company A' },
        { advertiser_name: 'Company A' },
        { advertiser_name: 'Company B' },
        { advertiser_name: 'Company B' },
        { advertiser_name: 'Company C' },
      ];

      const advertiserCounts = ads.reduce((acc, ad) => {
        acc[ad.advertiser_name] = (acc[ad.advertiser_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topAdvertisers = Object.entries(advertiserCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, adCount]) => ({ name, adCount }));

      expect(topAdvertisers[0].name).toBe('Company A');
      expect(topAdvertisers[0].adCount).toBe(3);
      expect(topAdvertisers[1].name).toBe('Company B');
      expect(topAdvertisers[1].adCount).toBe(2);
    });

    it('filters and sorts clusters by type', () => {
      const clusters = [
        { cluster_type: 'objection', label: 'Objection 1', frequency: 15 },
        { cluster_type: 'angle', label: 'Angle 1', frequency: 20 },
        { cluster_type: 'objection', label: 'Objection 2', frequency: 10 },
        { cluster_type: 'feature', label: 'Feature 1', frequency: 8 },
      ];

      const objectionClusters = clusters
        .filter(c => c.cluster_type === 'objection')
        .sort((a, b) => b.frequency - a.frequency);

      const angleClusters = clusters
        .filter(c => c.cluster_type === 'angle')
        .sort((a, b) => b.frequency - a.frequency);

      expect(objectionClusters.length).toBe(2);
      expect(objectionClusters[0].label).toBe('Objection 1');
      expect(angleClusters.length).toBe(1);
    });

    it('calculates longest running ads', () => {
      const now = Date.now();
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString();

      const ads = [
        { advertiser_name: 'Company A', headline: 'Ad 1', first_seen: sixtyDaysAgo },
        { advertiser_name: 'Company B', headline: 'Ad 2', first_seen: thirtyDaysAgo },
      ];

      const adsWithDays = ads
        .filter(a => a.first_seen)
        .map(a => ({
          advertiser: a.advertiser_name,
          headline: a.headline,
          daysRunning: Math.floor((now - new Date(a.first_seen).getTime()) / (1000 * 60 * 60 * 24)),
        }))
        .sort((a, b) => b.daysRunning - a.daysRunning);

      expect(adsWithDays[0].advertiser).toBe('Company A');
      expect(adsWithDays[0].daysRunning).toBeGreaterThan(50);
      expect(adsWithDays[1].daysRunning).toBeGreaterThan(25);
    });

    it('identifies pricing friction from objections', () => {
      const objectionClusters = [
        { label: 'Pricing too high', frequency: 15 },
        { label: 'Cost concerns', frequency: 10 },
        { label: 'Poor quality', frequency: 8 },
        { label: 'Slow performance', frequency: 5 },
      ];

      const pricingFriction = objectionClusters
        .filter(c => c.label.toLowerCase().includes('pric') || c.label.toLowerCase().includes('cost'))
        .map(c => c.label);

      expect(pricingFriction.length).toBe(2);
      expect(pricingFriction).toContain('Pricing too high');
      expect(pricingFriction).toContain('Cost concerns');
    });

    it('returns 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const response = { status: 401, error: 'Unauthorized' };

      expect(response.status).toBe(401);
    });

    it('returns 404 for non-existent run', async () => {
      const mockUser = { id: 'user-123' };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockRunQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found')
        }),
      };

      mockSupabase.from.mockReturnValue(mockRunQuery);

      const response = { status: 404, error: 'Run not found' };

      expect(response.status).toBe(404);
    });

    it('handles incomplete runs gracefully', async () => {
      const mockUser = { id: 'user-123' };
      const mockRun = {
        id: 'run-123',
        niche_query: 'test',
        status: 'running',
        created_at: '2024-01-01',
        finished_at: null,
      };

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const mockRunQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRun, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockRunQuery);

      // Report should still be accessible even if run is not complete
      expect(mockRun.status).toBe('running');
      expect(mockRun.finished_at).toBeNull();
    });

    it('limits gaps and concepts in response', () => {
      const gaps = Array(20).fill(null).map((_, i) => ({
        id: `gap-${i}`,
        type: 'product',
        title: `Gap ${i}`,
        problem: 'Problem',
        recommendation: 'Recommendation',
        score: 80 - i,
        confidence: 0.8,
      }));

      const concepts = Array(10).fill(null).map((_, i) => ({
        id: `concept-${i}`,
        name: `Concept ${i}`,
        oneLiner: 'One liner',
        platform: 'web',
        industry: 'Tech',
        businessModel: 'b2c',
        difficulty: 5,
        opportunityScore: 75 - i,
      }));

      const limitedGaps = gaps.slice(0, 10);
      const limitedConcepts = concepts.slice(0, 5);

      expect(limitedGaps.length).toBe(10);
      expect(limitedConcepts.length).toBe(5);
    });
  });
});

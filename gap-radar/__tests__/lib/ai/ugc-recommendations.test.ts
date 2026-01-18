/**
 * UGC Recommendations Generator Tests
 *
 * Tests the generation of:
 * - 10 hooks
 * - 5 scripts
 * - shot list
 */

import { generateUGCRecommendations } from '../../../src/lib/ai/ugc-recommendations';
import { UGCAsset, UGCPatterns } from '../../../src/types';

describe('UGC Recommendations Generator', () => {
  const mockAssetsWithPatterns: UGCAsset[] = [
    {
      id: 'asset-1',
      runId: 'test-run-1',
      source: 'tiktok_top_ads',
      platform: 'tiktok',
      url: 'https://tiktok.com/test1',
      caption: 'POV: You finally found an AI tool that actually works',
      createdAt: new Date('2025-01-01'),
      patterns: {
        hookType: 'POV / Relatable',
        format: 'Demo',
        proofType: 'Results shown',
        objectionHandled: 'Ease of use',
        ctaStyle: 'Link in bio',
        confidence: 0.9,
      },
      metrics: {
        views: 100000,
        likes: 5000,
        comments: 200,
        shares: 150,
        score: 85,
      },
    },
    {
      id: 'asset-2',
      runId: 'test-run-1',
      source: 'tiktok_commercial',
      platform: 'tiktok',
      url: 'https://tiktok.com/test2',
      caption: 'Stop wasting money on AI tools that don\'t work! This one is FREE',
      createdAt: new Date('2025-01-02'),
      patterns: {
        hookType: 'Pain point callout',
        format: 'Comparison',
        proofType: 'Numbers/Stats',
        objectionHandled: 'Pricing',
        ctaStyle: 'Direct command',
        confidence: 0.85,
      },
      metrics: {
        views: 80000,
        likes: 4000,
        comments: 150,
        shares: 120,
        score: 78,
      },
    },
    {
      id: 'asset-3',
      runId: 'test-run-1',
      source: 'tiktok_trend',
      platform: 'tiktok',
      url: 'https://tiktok.com/test3',
      caption: 'I tested 10 AI tools so you don\'t have to',
      createdAt: new Date('2025-01-03'),
      patterns: {
        hookType: 'Authority / Research',
        format: 'Review',
        proofType: 'Testing/Research',
        ctaStyle: 'Soft suggestion',
        confidence: 0.8,
      },
      metrics: {
        views: 120000,
        likes: 6000,
        comments: 300,
        shares: 200,
        score: 92,
      },
    },
  ];

  beforeEach(() => {
    // Reset environment for each test
    delete process.env.OPENAI_API_KEY;
  });

  describe('generateUGCRecommendations', () => {
    it('should generate recommendations with 10 hooks', async () => {
      const result = await generateUGCRecommendations('test-run-1', mockAssetsWithPatterns);

      expect(result).toBeDefined();
      expect(result.hooks).toBeDefined();
      expect(result.hooks.length).toBe(10);

      // Each hook should have text and type
      result.hooks.forEach(hook => {
        expect(hook.text).toBeDefined();
        expect(hook.text.length).toBeGreaterThan(0);
        expect(hook.type).toBeDefined();
        expect(hook.type.length).toBeGreaterThan(0);
      });
    });

    it('should generate recommendations with 5 scripts', async () => {
      const result = await generateUGCRecommendations('test-run-1', mockAssetsWithPatterns);

      expect(result).toBeDefined();
      expect(result.scripts).toBeDefined();
      expect(result.scripts.length).toBe(5);

      // Each script should have duration and outline
      result.scripts.forEach(script => {
        expect(script.duration).toBeDefined();
        expect(script.duration).toMatch(/^\d+(-\d+)?s$/); // e.g., "15s" or "30-60s"
        expect(script.outline).toBeDefined();
        expect(Array.isArray(script.outline)).toBe(true);
        expect(script.outline.length).toBeGreaterThan(0);
      });
    });

    it('should generate a shot list with camera instructions', async () => {
      const result = await generateUGCRecommendations('test-run-1', mockAssetsWithPatterns);

      expect(result).toBeDefined();
      expect(result.shotList).toBeDefined();
      expect(result.shotList.length).toBeGreaterThan(0);

      // Each shot should have description and notes
      result.shotList.forEach(shot => {
        expect(shot.shot).toBeDefined();
        expect(shot.shot.length).toBeGreaterThan(0);
        expect(shot.notes).toBeDefined();
      });
    });

    it('should generate angle map with priority rankings', async () => {
      const result = await generateUGCRecommendations('test-run-1', mockAssetsWithPatterns);

      expect(result).toBeDefined();
      expect(result.angleMap).toBeDefined();
      expect(result.angleMap.length).toBeGreaterThan(0);

      // Each angle should have angle, priority, and reasoning
      result.angleMap.forEach(angle => {
        expect(angle.angle).toBeDefined();
        expect(angle.angle.length).toBeGreaterThan(0);
        expect(angle.priority).toMatch(/^(high|medium|low)$/);
        expect(angle.reasoning).toBeDefined();
        expect(angle.reasoning.length).toBeGreaterThan(0);
      });
    });

    it('should prioritize patterns from high-performing assets', async () => {
      const result = await generateUGCRecommendations('test-run-1', mockAssetsWithPatterns);

      // Should include hook types from high-performing assets
      const hookTypes = result.hooks.map(h => h.type);

      // The highest performing asset (asset-3 with score 92) has "Authority / Research"
      // So we should see this type represented
      expect(hookTypes.some(type =>
        type.toLowerCase().includes('authority') ||
        type.toLowerCase().includes('research')
      )).toBe(true);
    });

    it('should generate diverse hook types', async () => {
      const result = await generateUGCRecommendations('test-run-1', mockAssetsWithPatterns);

      const uniqueTypes = new Set(result.hooks.map(h => h.type));

      // Should have at least 3 different hook types for variety
      expect(uniqueTypes.size).toBeGreaterThanOrEqual(3);
    });

    it('should generate scripts with appropriate lengths', async () => {
      const result = await generateUGCRecommendations('test-run-1', mockAssetsWithPatterns);

      // Scripts should vary in length (15s, 30s, 60s durations common for UGC)
      const durations = result.scripts.map(s => s.duration);
      const uniqueDurations = new Set(durations);

      // Should have variety in script lengths
      expect(uniqueDurations.size).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty asset list gracefully', async () => {
      const result = await generateUGCRecommendations('test-run-1', []);

      expect(result).toBeDefined();
      expect(result.hooks.length).toBe(10);
      expect(result.scripts.length).toBe(5);
      expect(result.shotList.length).toBeGreaterThan(0);

      // Hooks should be generic templates when no data available
      expect(result.hooks[0].text).toBeDefined();
    });

    it('should incorporate objections handled into hooks', async () => {
      const result = await generateUGCRecommendations('test-run-1', mockAssetsWithPatterns);

      const hookTexts = result.hooks.map(h => h.text.toLowerCase()).join(' ');

      // Should reference common objections from the mock data
      // Like pricing, ease of use, etc.
      expect(
        hookTexts.includes('free') ||
        hookTexts.includes('easy') ||
        hookTexts.includes('simple') ||
        hookTexts.includes('pricing') ||
        hookTexts.includes('money')
      ).toBe(true);
    });

    it('should generate shot list with variety of shot types', async () => {
      const result = await generateUGCRecommendations('test-run-1', mockAssetsWithPatterns);

      const shotDescriptions = result.shotList.map(s => s.shot.toLowerCase()).join(' ');

      // Should include common UGC shot types
      const hasVariety =
        shotDescriptions.includes('close') ||
        shotDescriptions.includes('screen') ||
        shotDescriptions.includes('hand') ||
        shotDescriptions.includes('face') ||
        shotDescriptions.includes('reaction');

      expect(hasVariety).toBe(true);
    });
  });

  describe('Mock mode (without OpenAI)', () => {
    it('should generate recommendations using heuristics when OpenAI API key is not set', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await generateUGCRecommendations('test-run-1', mockAssetsWithPatterns);

      expect(result).toBeDefined();
      expect(result.hooks.length).toBe(10);
      expect(result.scripts.length).toBe(5);
      expect(result.shotList.length).toBeGreaterThan(0);
    });
  });
});

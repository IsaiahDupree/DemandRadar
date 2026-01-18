/**
 * UGC Pattern Extractor Tests
 *
 * Tests the LLM-based extraction of UGC patterns:
 * - hook types
 * - formats
 * - proof types
 * - objections handled
 * - CTA styles
 */

import { extractUGCPatterns } from '../../../src/lib/ai/ugc-patterns';
import { UGCAsset } from '../../../src/types';

describe('UGC Pattern Extractor', () => {
  const mockAsset: UGCAsset = {
    id: 'test-asset-1',
    runId: 'test-run-1',
    source: 'tiktok_top_ads',
    platform: 'tiktok',
    url: 'https://tiktok.com/test',
    caption: 'POV: You finally found an AI tool that actually works 🤯 No more failed exports! Link in bio for first 10 free trials',
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    // Reset environment for each test
    delete process.env.OPENAI_API_KEY;
  });

  describe('extractUGCPatterns', () => {
    it('should extract patterns from a single UGC asset', async () => {
      const result = await extractUGCPatterns(mockAsset);

      expect(result).toBeDefined();
      expect(result.hookType).toBeDefined();
      expect(result.format).toBeDefined();
      expect(result.proofType).toBeDefined();
      expect(result.ctaStyle).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should identify POV hook type from caption', async () => {
      const result = await extractUGCPatterns(mockAsset);

      expect(result.hookType.toLowerCase()).toContain('pov');
    });

    it('should identify call-to-action style', async () => {
      const result = await extractUGCPatterns(mockAsset);

      expect(result.ctaStyle).toBeDefined();
      expect(result.ctaStyle.length).toBeGreaterThan(0);
    });

    it('should extract patterns from multiple assets in batch', async () => {
      const assets: UGCAsset[] = [
        mockAsset,
        {
          id: 'test-asset-2',
          runId: 'test-run-1',
          source: 'tiktok_trend',
          platform: 'tiktok',
          url: 'https://tiktok.com/test2',
          caption: 'Stop paying $20/month for AI tools! This one is FREE and works better. Comment LINK below 👇',
          createdAt: new Date('2025-01-02'),
        },
        {
          id: 'test-asset-3',
          runId: 'test-run-1',
          source: 'ig_hashtag',
          platform: 'instagram',
          url: 'https://instagram.com/test3',
          caption: 'I tested 10 AI design tools so you don\'t have to. Here\'s the winner 🏆',
          createdAt: new Date('2025-01-03'),
        },
      ];

      const results = await extractUGCPatterns(assets);

      expect(results).toHaveLength(3);
      expect(results[0].hookType).toBeDefined();
      expect(results[1].hookType).toBeDefined();
      expect(results[2].hookType).toBeDefined();
    });

    it('should handle asset with no caption gracefully', async () => {
      const assetWithoutCaption: UGCAsset = {
        id: 'test-asset-no-caption',
        runId: 'test-run-1',
        source: 'tiktok_top_ads',
        platform: 'tiktok',
        url: 'https://tiktok.com/test-no-caption',
        createdAt: new Date('2025-01-01'),
      };

      const result = await extractUGCPatterns(assetWithoutCaption);

      expect(result).toBeDefined();
      expect(result.confidence).toBeLessThan(0.3); // Low confidence for missing caption
    });

    it('should identify objection handling when present', async () => {
      const assetWithObjection: UGCAsset = {
        id: 'test-asset-objection',
        runId: 'test-run-1',
        source: 'tiktok_commercial',
        platform: 'tiktok',
        url: 'https://tiktok.com/test-objection',
        caption: 'Yes it works on Mac AND Windows! No subscription needed. Try it free today!',
        createdAt: new Date('2025-01-01'),
      };

      const result = await extractUGCPatterns(assetWithObjection);

      expect(result.objectionHandled).toBeDefined();
      expect(result.objectionHandled!.length).toBeGreaterThan(0);
    });

    it('should return higher confidence for detailed captions', async () => {
      const detailedAsset: UGCAsset = {
        id: 'test-asset-detailed',
        runId: 'test-run-1',
        source: 'tiktok_top_ads',
        platform: 'tiktok',
        url: 'https://tiktok.com/test-detailed',
        caption: 'POV: You finally found an AI design tool that doesn\'t require a subscription, works offline, and exports in 4K. I tested 15 tools and this is the only one that does all three. Before/after in the video. Link in bio - first 100 users get lifetime access!',
        createdAt: new Date('2025-01-01'),
      };

      const basicAsset: UGCAsset = {
        ...mockAsset,
        caption: 'Try this tool!',
      };

      const detailedResult = await extractUGCPatterns(detailedAsset);
      const basicResult = await extractUGCPatterns(basicAsset);

      expect(detailedResult.confidence).toBeGreaterThan(basicResult.confidence);
    });

    it('should extract common format types', async () => {
      const testCases = [
        {
          caption: 'Before vs After using this AI tool',
          expectedFormat: 'before/after',
        },
        {
          caption: 'Watch me test this tool in real-time',
          expectedFormat: 'demo',
        },
        {
          caption: 'Here are 5 AI tools you need to try',
          expectedFormat: 'listicle',
        },
      ];

      for (const testCase of testCases) {
        const asset: UGCAsset = {
          id: `test-${testCase.expectedFormat}`,
          runId: 'test-run-1',
          source: 'tiktok_trend',
          platform: 'tiktok',
          url: 'https://tiktok.com/test',
          caption: testCase.caption,
          createdAt: new Date('2025-01-01'),
        };

        const result = await extractUGCPatterns(asset);

        expect(result.format.toLowerCase()).toContain(testCase.expectedFormat.split('/')[0]);
      }
    });
  });

  describe('Mock mode (without OpenAI)', () => {
    it('should use heuristics when OpenAI API key is not set', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await extractUGCPatterns(mockAsset);

      expect(result).toBeDefined();
      expect(result.hookType).toBeDefined();
      expect(result.format).toBeDefined();
    });

    it('should identify POV in caption using heuristics', async () => {
      delete process.env.OPENAI_API_KEY;

      const povAsset: UGCAsset = {
        ...mockAsset,
        caption: 'POV: You discovered the best AI tool',
      };

      const result = await extractUGCPatterns(povAsset);

      expect(result.hookType.toLowerCase()).toContain('pov');
    });

    it('should identify pain point callouts using heuristics', async () => {
      delete process.env.OPENAI_API_KEY;

      const painAsset: UGCAsset = {
        ...mockAsset,
        caption: 'Stop wasting money on AI tools that don\'t work',
      };

      const result = await extractUGCPatterns(painAsset);

      expect(result.hookType.toLowerCase()).toMatch(/pain|problem|stop/);
    });
  });
});

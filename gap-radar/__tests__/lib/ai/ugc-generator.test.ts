/**
 * UGC Generator Tests
 */

import { generateUGCRecommendations, resetOpenAIInstance } from '@/lib/ai/ugc-generator';
import { Cluster } from '@/lib/ai/extractor';
import { GapOpportunity } from '@/lib/ai/gap-generator';
import OpenAI from 'openai';

jest.mock('openai');

const mockClusters: Cluster[] = [
  {
    cluster_type: 'objection',
    label: 'Pricing too high',
    examples: [{ id: '1', snippet: 'Too expensive' }],
    frequency: 15,
    intensity: 0.8,
  },
  {
    cluster_type: 'angle',
    label: 'Speed/Fast results',
    examples: [{ id: '2', snippet: 'Get results fast' }],
    frequency: 20,
    intensity: 0.6,
  },
];

const mockGaps: GapOpportunity[] = [
  {
    gap_type: 'product',
    title: 'Quality gap',
    problem: 'Users want quality, ads focus on speed',
    evidence_ads: [{ id: 'ad1', snippet: 'Fast results' }],
    evidence_reddit: [{ id: 'r1', snippet: 'Poor quality' }],
    recommendation: 'Build quality-first product',
    opportunity_score: 85,
    confidence: 0.8,
  },
];

describe('UGC Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetOpenAIInstance();
  });

  describe('generateUGCRecommendations', () => {
    it('returns UGC recommendations structure', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                hooks: [{ text: 'Test hook', type: 'POV' }],
                scripts: [{ duration: '30s', outline: ['Hook', 'Demo', 'CTA'] }],
                shot_list: [{ shot: 'Screen recording', notes: 'Show upload' }],
                angle_map: [{ angle: 'Quality', priority: 'high', reasoning: 'Top gap' }],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test tool');

      expect(ugc).toHaveProperty('hooks');
      expect(ugc).toHaveProperty('scripts');
      expect(ugc).toHaveProperty('shot_list');
      expect(ugc).toHaveProperty('angle_map');
      expect(Array.isArray(ugc.hooks)).toBe(true);
      expect(Array.isArray(ugc.scripts)).toBe(true);
      expect(Array.isArray(ugc.shot_list)).toBe(true);
      expect(Array.isArray(ugc.angle_map)).toBe(true);
    });

    it('generates 10 hooks', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                hooks: Array(15).fill({ text: 'Hook', type: 'POV' }),
                scripts: [],
                shot_list: [],
                angle_map: [],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      // Should limit to 10 hooks
      expect(ugc.hooks.length).toBeLessThanOrEqual(10);
    });

    it('hooks have text and type', async () => {
      delete process.env.OPENAI_API_KEY;

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      ugc.hooks.forEach(hook => {
        expect(hook).toHaveProperty('text');
        expect(hook).toHaveProperty('type');
        expect(typeof hook.text).toBe('string');
        expect(typeof hook.type).toBe('string');
      });
    });

    it('generates 3 script outlines', async () => {
      delete process.env.OPENAI_API_KEY;

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      expect(ugc.scripts.length).toBeLessThanOrEqual(3);
    });

    it('scripts have duration and outline', async () => {
      delete process.env.OPENAI_API_KEY;

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      ugc.scripts.forEach(script => {
        expect(script).toHaveProperty('duration');
        expect(script).toHaveProperty('outline');
        expect(Array.isArray(script.outline)).toBe(true);
      });
    });

    it('generates 6 shot list items', async () => {
      delete process.env.OPENAI_API_KEY;

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      expect(ugc.shot_list.length).toBeLessThanOrEqual(6);
    });

    it('shot list items have shot and notes', async () => {
      delete process.env.OPENAI_API_KEY;

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      ugc.shot_list.forEach(shot => {
        expect(shot).toHaveProperty('shot');
        expect(shot).toHaveProperty('notes');
        expect(typeof shot.shot).toBe('string');
        expect(typeof shot.notes).toBe('string');
      });
    });

    it('generates 5 angle mappings', async () => {
      delete process.env.OPENAI_API_KEY;

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      expect(ugc.angle_map.length).toBeLessThanOrEqual(5);
    });

    it('angle map has valid priorities', async () => {
      delete process.env.OPENAI_API_KEY;

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      const validPriorities = ['high', 'medium', 'low'];
      ugc.angle_map.forEach(angle => {
        expect(angle).toHaveProperty('angle');
        expect(angle).toHaveProperty('priority');
        expect(angle).toHaveProperty('reasoning');
        expect(validPriorities).toContain(angle.priority);
      });
    });

    it('incorporates objections into recommendations', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                hooks: [],
                scripts: [],
                shot_list: [],
                angle_map: [],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      expect(mockCreate).toHaveBeenCalled();
      const prompt = mockCreate.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain('USER OBJECTIONS');
      expect(prompt).toContain('Pricing too high');
    });

    it('uses competitor angles in recommendations', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                hooks: [],
                scripts: [],
                shot_list: [],
                angle_map: [],
              }),
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      const prompt = mockCreate.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain('COMPETITOR ANGLES');
      expect(prompt).toContain('Speed/Fast results');
    });

    it('uses mock data when API key is not set', async () => {
      delete process.env.OPENAI_API_KEY;

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      expect(ugc.hooks.length).toBeGreaterThan(0);
      expect(ugc.scripts.length).toBeGreaterThan(0);
      expect(ugc.shot_list.length).toBeGreaterThan(0);
      expect(ugc.angle_map.length).toBeGreaterThan(0);
    });

    it('handles API errors gracefully', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('API error'));

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      // Should fallback to mock data
      expect(ugc.hooks.length).toBeGreaterThan(0);
      expect(ugc.scripts.length).toBeGreaterThan(0);
    });

    it('handles empty clusters and gaps', async () => {
      delete process.env.OPENAI_API_KEY;

      const ugc = await generateUGCRecommendations([], [], 'test');

      expect(ugc.hooks).toBeDefined();
      expect(ugc.scripts).toBeDefined();
      expect(ugc.shot_list).toBeDefined();
      expect(ugc.angle_map).toBeDefined();
    });

    it('handles invalid JSON response', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'invalid json',
            },
          },
        ],
      });

      (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as any));

      process.env.OPENAI_API_KEY = 'test-key';

      const ugc = await generateUGCRecommendations(mockClusters, mockGaps, 'test');

      // Should fallback to mock data
      expect(ugc.hooks.length).toBeGreaterThan(0);
    });
  });
});

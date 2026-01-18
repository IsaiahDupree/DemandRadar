/**
 * BRIEF-016: Experiment Loop Feature Tests
 *
 * Tests for experiment generation, tracking, and history
 */

import {
  generateWeeklyExperiment,
  trackExperimentResult,
  getExperimentHistory,
  getCurrentWeekExperiment,
  type ExperimentResult,
} from '@/lib/experiments';

// Mock Supabase
const mockSupabaseSelect = jest.fn();
const mockSupabaseInsert = jest.fn();
const mockSupabaseUpsert = jest.fn();
const mockSupabaseFrom = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseSingle = jest.fn();
const mockSupabaseOrder = jest.fn();
const mockSupabaseLimit = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockSupabaseFrom,
  })),
}));

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  experiments: [
                    {
                      type: 'copy',
                      title: 'Test pain-focused hook',
                      hypothesis: 'Pain hooks will increase CTR by 15%',
                      setup: '1. Create variants\n2. Split traffic',
                      success_metrics: ['CTR > 2%'],
                      estimated_effort: 'low',
                      priority: 9,
                      evidence: 'Top complaints mention pricing',
                    },
                  ],
                }),
              },
            },
          ],
        }),
      },
    },
  }));
});

describe('Experiment Loop Feature (BRIEF-016)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock chain
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect,
      insert: mockSupabaseInsert,
      upsert: mockSupabaseUpsert,
    });

    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
      order: mockSupabaseOrder,
      limit: mockSupabaseLimit,
      single: mockSupabaseSingle,
    });

    mockSupabaseEq.mockReturnValue({
      eq: mockSupabaseEq,
      single: mockSupabaseSingle,
      order: mockSupabaseOrder,
      limit: mockSupabaseLimit,
    });

    mockSupabaseOrder.mockReturnValue({
      limit: mockSupabaseLimit,
    });

    mockSupabaseInsert.mockReturnValue({
      select: mockSupabaseSelect,
    });

    mockSupabaseUpsert.mockReturnValue({
      select: mockSupabaseSelect,
    });
  });

  describe('generateWeeklyExperiment', () => {
    it('should generate a new experiment for a niche', async () => {
      // Mock no existing experiment
      mockSupabaseSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock successful insert
      mockSupabaseSingle.mockResolvedValueOnce({
        data: {
          id: 'exp-123',
          niche_id: 'niche-456',
          week: '2026-W03',
          type: 'copy',
          title: 'Test pain-focused hook',
          hypothesis: 'Pain hooks will increase CTR by 15%',
          setup_instructions: '1. Create variants\n2. Split traffic',
          success_metrics: ['CTR > 2%'],
          estimated_effort: 'low',
          priority: 9,
          evidence: 'Top complaints mention pricing',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const snapshot = {
        demand_score: 75,
        ad_signals: {
          top_angles: ['Angle 1', 'Angle 2'],
          top_offers: ['Offer 1'],
        },
        forum_signals: {
          top_complaints: ['Too expensive', 'Hard to use'],
          top_desires: ['Better UX', 'Lower price'],
        },
        competitor_signals: {
          pricing_changes: [],
          feature_changes: [],
        },
      };

      const result = await generateWeeklyExperiment('niche-456', snapshot);

      expect(result).toBeDefined();
      expect(result.type).toBe('copy');
      expect(result.niche_id).toBe('niche-456');
      expect(mockSupabaseFrom).toHaveBeenCalledWith('niche_experiments');
    });
  });

  describe('trackExperimentResult', () => {
    it('should track experiment results', async () => {
      const resultData: Omit<ExperimentResult, 'id' | 'created_at'> = {
        experiment_id: 'exp-123',
        outcome: 'success',
        metrics_achieved: { ctr: 2.5, cpc: 1.2 },
        learnings: 'Pain-focused hooks performed better',
        confidence: 0.85,
      };

      mockSupabaseSingle.mockResolvedValueOnce({
        data: {
          id: 'result-789',
          ...resultData,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await trackExperimentResult(resultData);

      expect(result).toBeDefined();
      expect(result.outcome).toBe('success');
      expect(result.confidence).toBe(0.85);
      expect(mockSupabaseUpsert).toHaveBeenCalled();
    });
  });
});

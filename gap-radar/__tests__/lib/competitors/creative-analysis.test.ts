/**
 * Tests for Creative Shift Analysis
 * Feature: INTEL-006 - Creative Shift Analysis
 *
 * Acceptance Criteria:
 * 1. Pattern detection works
 * 2. Shift summary is generated
 * 3. Significance rating is provided
 * @jest-environment node
 */

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

import { analyzeCreativeShift } from '@/lib/competitors/creative-analysis';

interface Ad {
  id: string;
  headline: string;
  body?: string;
  run_days?: number;
}

describe('Creative Shift Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  const previousAds: Ad[] = [
    {
      id: 'ad-1',
      headline: 'Save Time with AI Automation',
      body: 'Automate your workflow and boost productivity by 10x',
      run_days: 45,
    },
    {
      id: 'ad-2',
      headline: 'Work Smarter, Not Harder',
      body: 'Let AI handle the boring tasks while you focus on what matters',
      run_days: 38,
    },
    {
      id: 'ad-3',
      headline: 'Boost Your Team Productivity',
      body: 'AI-powered tools that make your team 10x more efficient',
      run_days: 32,
    },
  ];

  const newAds: Ad[] = [
    {
      id: 'ad-4',
      headline: 'Enterprise-Grade Security You Can Trust',
      body: 'SOC 2 compliant, GDPR ready, and trusted by Fortune 500 companies',
      run_days: 2,
    },
    {
      id: 'ad-5',
      headline: 'Bank-Level Encryption for Your Data',
      body: 'Keep your sensitive information safe with our advanced security features',
      run_days: 2,
    },
    {
      id: 'ad-6',
      headline: 'Compliance Made Easy',
      body: 'Meet all regulatory requirements with our built-in compliance tools',
      run_days: 1,
    },
  ];

  describe('Pattern Detection', () => {
    it('should detect a creative shift when ads change messaging', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detected: true,
                shift_type: 'messaging_change',
                summary:
                  'Competitor shifted from productivity benefits to security and compliance messaging',
                patterns: {
                  previous_themes: ['productivity', 'automation', 'efficiency'],
                  new_themes: ['security', 'compliance', 'enterprise'],
                },
                significance: 'high',
              }),
            },
          },
        ],
      });

      const result = await analyzeCreativeShift(previousAds, newAds);

      expect(result.detected).toBe(true);
      expect(result.shift_type).toBe('messaging_change');
      expect(result.significance).toBe('high');
    });

    it('should not detect a shift with similar messaging', async () => {
      const similarNewAds: Ad[] = [
        {
          id: 'ad-7',
          headline: 'Increase Team Efficiency',
          body: 'AI automation to save time and boost productivity',
          run_days: 1,
        },
        {
          id: 'ad-8',
          headline: 'Automate Your Workflow',
          body: 'Work smarter with AI-powered automation',
          run_days: 1,
        },
        {
          id: 'ad-9',
          headline: 'AI Tools for Productivity',
          body: 'Make your team more productive with intelligent automation',
          run_days: 1,
        },
      ];

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detected: false,
                summary: 'No significant shift detected, messaging remains consistent',
                significance: 'low',
              }),
            },
          },
        ],
      });

      const result = await analyzeCreativeShift(previousAds, similarNewAds);

      expect(result.detected).toBe(false);
      expect(result.significance).toBe('low');
    });

    it('should require at least 3 new ads for analysis', async () => {
      const fewNewAds: Ad[] = [
        {
          id: 'ad-10',
          headline: 'New Ad',
          body: 'Content',
          run_days: 1,
        },
      ];

      const result = await analyzeCreativeShift(previousAds, fewNewAds);

      expect(result.detected).toBe(false);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('Shift Summary', () => {
    it('should generate a comprehensive shift summary', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detected: true,
                shift_type: 'positioning_change',
                summary:
                  'Competitor pivoted from targeting SMBs with productivity messaging to enterprise focus with security and compliance',
                patterns: {
                  previous_themes: ['productivity', 'automation'],
                  new_themes: ['security', 'enterprise', 'compliance'],
                  previous_tone: 'casual',
                  new_tone: 'professional',
                  previous_audience: 'small businesses',
                  new_audience: 'enterprise',
                },
                significance: 'high',
                recommendations: [
                  'Consider emphasizing your own security features',
                  'Monitor for increased enterprise competition',
                ],
              }),
            },
          },
        ],
      });

      const result = await analyzeCreativeShift(previousAds, newAds);

      expect(result.summary).toContain('pivoted');
      expect(result.summary).toContain('enterprise');
      expect(result.patterns).toBeDefined();
      expect(result.recommendations).toHaveLength(2);
    });

    it('should include details about tone and audience shifts', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detected: true,
                shift_type: 'tone_change',
                summary: 'Tone shifted from urgent/aggressive to calm/educational',
                patterns: {
                  previous_tone: 'urgent',
                  new_tone: 'educational',
                },
                significance: 'medium',
              }),
            },
          },
        ],
      });

      const result = await analyzeCreativeShift(previousAds, newAds);

      expect(result.patterns.previous_tone).toBe('urgent');
      expect(result.patterns.new_tone).toBe('educational');
    });
  });

  describe('Significance Rating', () => {
    it('should rate major pivots as high significance', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detected: true,
                shift_type: 'major_pivot',
                summary: 'Complete messaging overhaul targeting different market segment',
                significance: 'high',
              }),
            },
          },
        ],
      });

      const result = await analyzeCreativeShift(previousAds, newAds);

      expect(result.significance).toBe('high');
    });

    it('should rate incremental changes as medium significance', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detected: true,
                shift_type: 'incremental_refinement',
                summary: 'Minor adjustments to value propositions',
                significance: 'medium',
              }),
            },
          },
        ],
      });

      const result = await analyzeCreativeShift(previousAds, newAds);

      expect(result.significance).toBe('medium');
    });

    it('should rate minor tweaks as low significance', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detected: true,
                shift_type: 'minor_tweak',
                summary: 'Slight wording changes, same core message',
                significance: 'low',
              }),
            },
          },
        ],
      });

      const result = await analyzeCreativeShift(previousAds, newAds);

      expect(result.significance).toBe('low');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty previous ads', async () => {
      const result = await analyzeCreativeShift([], newAds);

      expect(result.detected).toBe(false);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should handle ads without body text', async () => {
      const adsWithoutBody: Ad[] = [
        { id: 'ad-11', headline: 'Headline 1' },
        { id: 'ad-12', headline: 'Headline 2' },
        { id: 'ad-13', headline: 'Headline 3' },
      ];

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detected: false,
                summary: 'Insufficient data for analysis',
                significance: 'low',
              }),
            },
          },
        ],
      });

      const result = await analyzeCreativeShift(previousAds, adsWithoutBody);

      expect(result).toBeDefined();
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should handle OpenAI errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('OpenAI API error'));

      const result = await analyzeCreativeShift(previousAds, newAds);

      expect(result.detected).toBe(false);
      expect(result.error).toBe('Analysis failed');
    });

    it('should handle missing API key', async () => {
      delete process.env.OPENAI_API_KEY;

      const result = await analyzeCreativeShift(previousAds, newAds);

      expect(result.detected).toBe(false);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Invalid JSON {',
            },
          },
        ],
      });

      const result = await analyzeCreativeShift(previousAds, newAds);

      expect(result.detected).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('OpenAI Integration', () => {
    it('should call OpenAI with correct parameters', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detected: false,
                summary: 'Test',
                significance: 'low',
              }),
            },
          },
        ],
      });

      await analyzeCreativeShift(previousAds, newAds);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
        })
      );
    });

    it('should include previous and new ads in the prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                detected: false,
                summary: 'Test',
                significance: 'low',
              }),
            },
          },
        ],
      });

      await analyzeCreativeShift(previousAds, newAds);

      const callArgs = mockCreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');

      expect(userMessage.content).toContain('Save Time with AI Automation');
      expect(userMessage.content).toContain('Enterprise-Grade Security');
    });
  });
});

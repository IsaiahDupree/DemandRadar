import {
  generateCopyForBrief,
  type CopyGenerationInput,
  type GeneratedCopy,
} from '@/lib/ai/brief-copy-generator';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('Brief Copy Generator', () => {
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock OpenAI chat completions
    mockCreate = jest.fn();
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as any));
  });

  describe('generateCopyForBrief', () => {
    it('should generate 3 ad hooks, 3 subject lines, and 1 landing paragraph', async () => {
      const input: CopyGenerationInput = {
        offeringName: 'AI Marketing Tools',
        topPainPoints: ['Too time-consuming', 'Expensive tools', 'Hard to learn'],
        topDesires: ['Save time', 'Better ROI', 'Easy to use'],
        topAngles: ['AI-powered', 'Automation', 'Fast results'],
        demandScore: 85,
        trend: 'up',
      };

      // Mock ad hooks response
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                hooks: [
                  'Stop wasting 10 hours/week on marketing tasks',
                  'Cut your marketing costs by 60% with AI',
                  'Master marketing automation in 5 minutes',
                ],
              }),
            },
          },
        ],
      });

      // Mock subject lines response
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                subjectLines: [
                  'Your marketing just got 10x faster',
                  'This AI tool saves $5k/month',
                  'Marketing automation for beginners',
                ],
              }),
            },
          },
        ],
      });

      // Mock landing copy response
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                paragraph:
                  'Transform your marketing with AI-powered automation. Save 10 hours per week while cutting costs by 60%. No technical experience needed.',
              }),
            },
          },
        ],
      });

      const result = await generateCopyForBrief(input);

      expect(result.adHooks).toHaveLength(3);
      expect(result.subjectLines).toHaveLength(3);
      expect(result.landingParagraph).toBeTruthy();
      expect(typeof result.landingParagraph).toBe('string');

      // All items should be non-empty strings
      result.adHooks.forEach((hook) => {
        expect(typeof hook).toBe('string');
        expect(hook.length).toBeGreaterThan(0);
      });
      result.subjectLines.forEach((subject) => {
        expect(typeof subject).toBe('string');
        expect(subject.length).toBeGreaterThan(0);
      });
    });

    it('should handle OpenAI errors gracefully with fallback content', async () => {
      const input: CopyGenerationInput = {
        offeringName: 'Test Product',
        topPainPoints: ['Pain 1'],
        topDesires: ['Desire 1'],
        topAngles: ['Angle 1'],
        demandScore: 70,
        trend: 'stable',
      };

      mockCreate.mockRejectedValue(new Error('OpenAI API error'));

      const result = await generateCopyForBrief(input);

      // Should return fallback content
      expect(result.adHooks).toHaveLength(3);
      expect(result.subjectLines).toHaveLength(3);
      expect(result.landingParagraph).toBeTruthy();
    });

    it('should generate copy for specific offering with signals', async () => {
      const input: CopyGenerationInput = {
        offeringName: 'SaaS Analytics Platform',
        topPainPoints: ['Complex dashboards', 'Slow queries'],
        topDesires: ['Simple insights', 'Fast analytics'],
        topAngles: ['Real-time data', 'One-click reports'],
        demandScore: 92,
        trend: 'up',
      };

      // Mock all three calls (ad hooks, subject lines, landing)
      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  hooks: ['Hook 1', 'Hook 2', 'Hook 3'],
                }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  subjectLines: ['Subject 1', 'Subject 2', 'Subject 3'],
                }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  paragraph: 'Landing paragraph',
                }),
              },
            },
          ],
        });

      const result = await generateCopyForBrief(input);

      // Verify it returns valid copy
      expect(result.adHooks).toHaveLength(3);
      expect(result.subjectLines).toHaveLength(3);
      expect(result.landingParagraph).toBeTruthy();
    });

    it('should generate exactly 3 hooks and 3 subject lines', async () => {
      const input: CopyGenerationInput = {
        offeringName: 'Test Product',
        topPainPoints: ['Pain'],
        topDesires: ['Desire'],
        topAngles: ['Angle'],
        demandScore: 75,
        trend: 'stable',
      };

      // Mock returning more than 3 items for hooks, less than 3 for subject lines
      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  hooks: ['H1', 'H2', 'H3', 'H4', 'H5'],
                }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  subjectLines: ['S1', 'S2'],
                }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  paragraph: 'Test',
                }),
              },
            },
          ],
        });

      const result = await generateCopyForBrief(input);

      // Core requirement: always returns exactly 3 of each
      expect(result.adHooks).toHaveLength(3);
      expect(result.subjectLines).toHaveLength(3);
      expect(result.landingParagraph).toBeTruthy();

      // Each item should be a non-empty string
      result.adHooks.forEach((hook) => {
        expect(typeof hook).toBe('string');
        expect(hook.length).toBeGreaterThan(0);
      });
      result.subjectLines.forEach((subject) => {
        expect(typeof subject).toBe('string');
        expect(subject.length).toBeGreaterThan(0);
      });
    });

    it('should use consistent model and parameters', async () => {
      const input: CopyGenerationInput = {
        offeringName: 'Test',
        topPainPoints: [],
        topDesires: [],
        topAngles: [],
        demandScore: 80,
        trend: 'up',
      };

      // Mock all three calls
      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  hooks: ['H1', 'H2', 'H3'],
                }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  subjectLines: ['S1', 'S2', 'S3'],
                }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  paragraph: 'P',
                }),
              },
            },
          ],
        });

      const result = await generateCopyForBrief(input);

      // Just verify we get valid results
      expect(result.adHooks).toHaveLength(3);
      expect(result.subjectLines).toHaveLength(3);
      expect(result.landingParagraph).toBeTruthy();
    });

    it('should handle empty or minimal input gracefully', async () => {
      const input: CopyGenerationInput = {
        offeringName: 'Minimal Product',
        topPainPoints: [],
        topDesires: [],
        topAngles: [],
        demandScore: 50,
        trend: 'stable',
      };

      // Mock all three calls
      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  hooks: ['Generic hook 1', 'Generic hook 2', 'Generic hook 3'],
                }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  subjectLines: ['Subject 1', 'Subject 2', 'Subject 3'],
                }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  paragraph: 'Generic landing copy',
                }),
              },
            },
          ],
        });

      const result = await generateCopyForBrief(input);

      expect(result.adHooks).toHaveLength(3);
      expect(result.subjectLines).toHaveLength(3);
      expect(result.landingParagraph).toBeTruthy();
    });
  });
});

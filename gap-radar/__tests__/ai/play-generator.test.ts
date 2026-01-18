/**
 * Tests for AI Play Generator (BRIEF-006)
 *
 * Acceptance Criteria:
 * 1. 3 plays per brief
 * 2. Evidence-backed
 * 3. Priority ordered
 */

// Mock OpenAI before importing the module
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    plays: [
                      {
                        type: "product",
                        action: "Add batch processing feature",
                        evidence: "60 users requested batch processing",
                        priority: "high",
                      },
                      {
                        type: "offer",
                        action: "Test free trial offer",
                        evidence: "35 purchase intent signals detected",
                        priority: "medium",
                      },
                      {
                        type: "distribution",
                        action: "Test winning angle: Remove watermarks instantly",
                        evidence: "25 advertisers using similar approach",
                        priority: "high",
                      },
                    ],
                  }),
                },
              },
            ],
          }),
        },
      },
    })),
  };
});

import { generatePlays } from "@/lib/ai/play-generator";
import { generateMockSignals } from "@/lib/scoring/demand-score";
import type { DemandMetrics } from "@/lib/scoring/demand-score";

describe("AI Play Generator", () => {
  const mockSignals = generateMockSignals();
  const mockMetrics: DemandMetrics = {
    demandScore: 75,
    opportunityScore: 68,
    messageMarketFit: 72,
    trend: "up",
    trendDelta: 5,
  };

  describe("generatePlays", () => {
    it("should return exactly 3 plays", async () => {
      const plays = await generatePlays("Logo Maker", mockSignals, mockMetrics);

      expect(plays).toHaveLength(3);
    });

    it("should include one product play", async () => {
      const plays = await generatePlays("Logo Maker", mockSignals, mockMetrics);

      const productPlays = plays.filter((p) => p.type === "product");
      expect(productPlays.length).toBeGreaterThanOrEqual(1);
    });

    it("should include one offer play", async () => {
      const plays = await generatePlays("Logo Maker", mockSignals, mockMetrics);

      const offerPlays = plays.filter((p) => p.type === "offer");
      expect(offerPlays.length).toBeGreaterThanOrEqual(1);
    });

    it("should include one distribution play", async () => {
      const plays = await generatePlays("Logo Maker", mockSignals, mockMetrics);

      const distributionPlays = plays.filter((p) => p.type === "distribution");
      expect(distributionPlays.length).toBeGreaterThanOrEqual(1);
    });

    it("should include evidence for each play", async () => {
      const plays = await generatePlays("Logo Maker", mockSignals, mockMetrics);

      plays.forEach((play) => {
        expect(play.evidence).toBeDefined();
        expect(play.evidence.length).toBeGreaterThan(0);
      });
    });

    it("should include priority for each play", async () => {
      const plays = await generatePlays("Logo Maker", mockSignals, mockMetrics);

      plays.forEach((play) => {
        expect(play.priority).toBeDefined();
        expect(["high", "medium", "low"]).toContain(play.priority);
      });
    });

    it("should include actionable recommendations", async () => {
      const plays = await generatePlays("Logo Maker", mockSignals, mockMetrics);

      plays.forEach((play) => {
        expect(play.action).toBeDefined();
        expect(play.action.length).toBeGreaterThan(0);
        // Action should be a sentence (imperative form)
        expect(typeof play.action).toBe("string");
      });
    });

    it("should prioritize high-priority plays first", async () => {
      const plays = await generatePlays("Logo Maker", mockSignals, mockMetrics);

      // The plays should be ordered by priority
      const priorities = plays.map((p) => p.priority);
      const priorityValues = { high: 3, medium: 2, low: 1 };

      for (let i = 0; i < priorities.length - 1; i++) {
        const currentValue = priorityValues[priorities[i]];
        const nextValue = priorityValues[priorities[i + 1]];
        expect(currentValue).toBeGreaterThanOrEqual(nextValue);
      }
    });

    it("should handle empty signals gracefully", async () => {
      const emptySignals = {
        ads: {
          advertiserCount: 0,
          avgLongevityDays: 0,
          topAngles: [],
          topOffers: [],
        },
        search: {
          buyerIntentKeywords: [],
          totalVolume: 0,
        },
        mentions: {
          currentWeekCount: 0,
          previousWeekCount: 0,
          sources: [],
        },
        forums: {
          complaints: [],
          desires: [],
          purchaseTriggers: 0,
        },
        competitors: {
          activeCompetitors: 0,
          pricingChanges: [],
          featureChanges: [],
        },
      };

      const plays = await generatePlays("Logo Maker", emptySignals, mockMetrics);

      // Should still return 3 plays even with no data
      expect(plays).toHaveLength(3);
      plays.forEach((play) => {
        expect(play.action).toBeDefined();
        expect(play.evidence).toBeDefined();
        expect(play.priority).toBeDefined();
      });
    });
  });

  describe("Play Structure", () => {
    it("should have correct TypeScript types", async () => {
      const plays = await generatePlays("Logo Maker", mockSignals, mockMetrics);

      plays.forEach((play) => {
        // Type assertions
        expect(["product", "offer", "distribution"]).toContain(play.type);
        expect(typeof play.action).toBe("string");
        expect(typeof play.evidence).toBe("string");
        expect(["high", "medium", "low"]).toContain(play.priority);
      });
    });
  });
});

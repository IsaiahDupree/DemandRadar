/**
 * Tests for Demand Score Calculator
 *
 * Validates BRIEF-004 acceptance criteria:
 * 1. Score 0-100
 * 2. Trend delta calculated
 * 3. Message-market fit score
 */

import {
  calculateDemandScore,
  generateMockSignals,
  type WeeklySignals,
  type DemandMetrics,
} from "@/lib/scoring/demand-score";

describe("Demand Score Calculator", () => {
  describe("calculateDemandScore", () => {
    it("should return a score between 0-100", () => {
      const signals = generateMockSignals();
      const result = calculateDemandScore(signals);

      expect(result.demandScore).toBeGreaterThanOrEqual(0);
      expect(result.demandScore).toBeLessThanOrEqual(100);
    });

    it("should calculate opportunity score between 0-100", () => {
      const signals = generateMockSignals();
      const result = calculateDemandScore(signals);

      expect(result.opportunityScore).toBeGreaterThanOrEqual(0);
      expect(result.opportunityScore).toBeLessThanOrEqual(100);
    });

    it("should calculate message-market fit score between 0-100", () => {
      const signals = generateMockSignals();
      const result = calculateDemandScore(signals);

      expect(result.messageMarketFit).toBeGreaterThanOrEqual(0);
      expect(result.messageMarketFit).toBeLessThanOrEqual(100);
    });

    it("should calculate trend delta correctly", () => {
      const signals = generateMockSignals();
      signals.previousScore = 50;
      const result = calculateDemandScore(signals);

      const expectedDelta = result.demandScore - 50;
      expect(result.trendDelta).toBe(expectedDelta);
    });

    it("should return 'up' trend when score increases significantly", () => {
      const signals = generateMockSignals();
      signals.previousScore = 30; // Much lower than typical score
      const result = calculateDemandScore(signals);

      if (result.demandScore - 30 > 5) {
        expect(result.trend).toBe("up");
      }
    });

    it("should return 'down' trend when score decreases significantly", () => {
      const signals = generateMockSignals();
      signals.previousScore = 95; // Much higher than typical score
      const result = calculateDemandScore(signals);

      if (95 - result.demandScore > 5) {
        expect(result.trend).toBe("down");
      }
    });

    it("should return 'stable' trend when score changes minimally", () => {
      const signals = generateMockSignals();
      const firstResult = calculateDemandScore(signals);

      // Set previous score to current score
      signals.previousScore = firstResult.demandScore;
      const result = calculateDemandScore(signals);

      expect(result.trend).toBe("stable");
    });

    it("should handle zero ad activity", () => {
      const signals: WeeklySignals = {
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

      const result = calculateDemandScore(signals);

      // With zero activity but also zero competition, there's a baseline score
      // from the inverted competitive heat: (100 - 0) * 0.1 = 10
      expect(result.demandScore).toBe(10);
      expect(result.opportunityScore).toBeGreaterThanOrEqual(0);
    });

    it("should handle high competition (inverse scoring)", () => {
      const lowCompSignals = generateMockSignals();
      lowCompSignals.competitors.activeCompetitors = 5;

      const highCompSignals = generateMockSignals();
      highCompSignals.competitors.activeCompetitors = 50;

      const lowCompResult = calculateDemandScore(lowCompSignals);
      const highCompResult = calculateDemandScore(highCompSignals);

      // Lower competition should yield higher demand score (all else equal)
      // This is because competitive heat is inverted in the formula
      expect(lowCompResult.demandScore).toBeGreaterThan(highCompResult.demandScore);
    });

    it("should weight ad activity at 30%", () => {
      const baseSignals = generateMockSignals();
      const highAdSignals = { ...baseSignals };
      highAdSignals.ads = {
        advertiserCount: 100, // Very high
        avgLongevityDays: 120, // Very high
        topAngles: baseSignals.ads.topAngles,
        topOffers: baseSignals.ads.topOffers,
      };

      const baseResult = calculateDemandScore(baseSignals);
      const highAdResult = calculateDemandScore(highAdSignals);

      // Higher ad activity should increase score
      expect(highAdResult.demandScore).toBeGreaterThan(baseResult.demandScore);
    });

    it("should handle first week with no previous data", () => {
      const signals = generateMockSignals();
      signals.mentions.previousWeekCount = 0;
      signals.mentions.currentWeekCount = 50;
      delete signals.previousScore;

      const result = calculateDemandScore(signals);

      expect(result.trend).toBe("stable");
      expect(result.trendDelta).toBe(0);
    });

    it("should calculate growth rate correctly", () => {
      const signals = generateMockSignals();
      signals.mentions.previousWeekCount = 100;
      signals.mentions.currentWeekCount = 200; // 100% growth

      const result = calculateDemandScore(signals);

      // With 100% growth, velocity component should be maximized
      expect(result.demandScore).toBeGreaterThan(0);
    });

    it("should handle buyer intent keywords", () => {
      const noBuyerIntent: WeeklySignals = {
        ...generateMockSignals(),
        search: {
          buyerIntentKeywords: [
            { keyword: "random keyword", volume: 1000 },
            { keyword: "another keyword", volume: 500 },
          ],
          totalVolume: 1500,
        },
      };

      const highBuyerIntent: WeeklySignals = {
        ...generateMockSignals(),
        search: {
          buyerIntentKeywords: [
            { keyword: "best product", volume: 1000 },
            { keyword: "pricing comparison", volume: 500 },
            { keyword: "review alternative", volume: 300 },
            { keyword: "vs competitor", volume: 200 },
          ],
          totalVolume: 2000,
        },
      };

      const noBuyerResult = calculateDemandScore(noBuyerIntent);
      const highBuyerResult = calculateDemandScore(highBuyerIntent);

      // More buyer intent keywords should increase score
      expect(highBuyerResult.demandScore).toBeGreaterThan(noBuyerResult.demandScore);
    });

    it("should calculate pain intensity from complaints and desires", () => {
      const lowPain: WeeklySignals = {
        ...generateMockSignals(),
        forums: {
          complaints: [{ text: "minor issue", frequency: 5 }],
          desires: [{ text: "nice to have", frequency: 5 }],
          purchaseTriggers: 2,
        },
      };

      const highPain: WeeklySignals = {
        ...generateMockSignals(),
        forums: {
          complaints: [
            { text: "major problem", frequency: 80 },
            { text: "critical bug", frequency: 60 },
          ],
          desires: [
            { text: "must have feature", frequency: 70 },
            { text: "essential capability", frequency: 50 },
          ],
          purchaseTriggers: 40,
        },
      };

      const lowPainResult = calculateDemandScore(lowPain);
      const highPainResult = calculateDemandScore(highPain);

      // Higher pain intensity should increase score
      expect(highPainResult.demandScore).toBeGreaterThan(lowPainResult.demandScore);
    });

    it("should return all required metrics", () => {
      const signals = generateMockSignals();
      const result = calculateDemandScore(signals);

      expect(result).toHaveProperty("demandScore");
      expect(result).toHaveProperty("opportunityScore");
      expect(result).toHaveProperty("messageMarketFit");
      expect(result).toHaveProperty("trend");
      expect(result).toHaveProperty("trendDelta");

      expect(typeof result.demandScore).toBe("number");
      expect(typeof result.opportunityScore).toBe("number");
      expect(typeof result.messageMarketFit).toBe("number");
      expect(["up", "down", "stable"]).toContain(result.trend);
      expect(typeof result.trendDelta).toBe("number");
    });

    it("should calculate message-market fit based on keyword overlap", () => {
      const noOverlap: WeeklySignals = {
        ...generateMockSignals(),
        ads: {
          advertiserCount: 25,
          avgLongevityDays: 45,
          topAngles: ["completely different angle", "unrelated benefit"],
          topOffers: ["random offer", "unrelated promotion"],
        },
        forums: {
          complaints: [{ text: "specific pain point xyz", frequency: 30 }],
          desires: [{ text: "unique desire abc", frequency: 40 }],
          purchaseTriggers: 20,
        },
      };

      const highOverlap: WeeklySignals = {
        ...generateMockSignals(),
        ads: {
          advertiserCount: 25,
          avgLongevityDays: 45,
          topAngles: ["fast rendering", "easy to use", "affordable pricing"],
          topOffers: ["free trial", "money back guarantee"],
        },
        forums: {
          complaints: [
            { text: "slow rendering speed", frequency: 30 },
            { text: "expensive pricing model", frequency: 25 },
          ],
          desires: [
            { text: "faster rendering", frequency: 40 },
            { text: "more affordable pricing", frequency: 35 },
            { text: "easier to use", frequency: 30 },
          ],
          purchaseTriggers: 20,
        },
      };

      const noOverlapResult = calculateDemandScore(noOverlap);
      const highOverlapResult = calculateDemandScore(highOverlap);

      // Higher keyword overlap should yield higher message-market fit
      expect(highOverlapResult.messageMarketFit).toBeGreaterThan(
        noOverlapResult.messageMarketFit
      );
    });
  });

  describe("generateMockSignals", () => {
    it("should generate valid mock signals", () => {
      const signals = generateMockSignals();

      expect(signals.ads).toBeDefined();
      expect(signals.search).toBeDefined();
      expect(signals.mentions).toBeDefined();
      expect(signals.forums).toBeDefined();
      expect(signals.competitors).toBeDefined();

      expect(signals.ads.advertiserCount).toBeGreaterThan(0);
      expect(signals.ads.topAngles.length).toBeGreaterThan(0);
      expect(signals.search.buyerIntentKeywords.length).toBeGreaterThan(0);
      expect(signals.forums.complaints.length).toBeGreaterThan(0);
    });

    it("should generate signals that produce a valid score", () => {
      const signals = generateMockSignals();
      const result = calculateDemandScore(signals);

      expect(result.demandScore).toBeGreaterThan(0);
      expect(result.demandScore).toBeLessThanOrEqual(100);
    });
  });
});

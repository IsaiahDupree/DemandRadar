/**
 * Build-to-Profit Score Tests
 *
 * Tests for the Build-to-Profit scoring formula
 * @jest-environment node
 */

import {
  calculateBuildToProfitScore,
  normalizeTAM,
  normalizeMargin,
  normalizeComplexity,
  humanTouchToFactor,
  timeToValueToFactor,
  rankIdeasByBuildToProfit,
  BuildToProfitInputs,
} from '@/lib/scoring/build-to-profit';

describe('Build-to-Profit Score', () => {
  describe('calculateBuildToProfitScore', () => {
    it('should calculate score with all factors included', () => {
      const inputs: BuildToProfitInputs = {
        opportunity: 80,
        tamFactor: 0.7,
        marginFactor: 0.8,
        timeToValueFactor: 0.9,
        cacProxy: 0.5,
        complexity: 0.4,
        touchFactor: 0.3,
      };

      const score = calculateBuildToProfitScore(inputs);

      // Expected: (80 * 0.7 * 0.8 * 0.9) / (0.5 * 0.4 * 0.3)
      // = 40.32 / 0.06 = 672
      expect(score).toBeGreaterThan(0);
      expect(score).toBeCloseTo(672, 0);
    });

    it('should handle high opportunity with low complexity', () => {
      const inputs: BuildToProfitInputs = {
        opportunity: 90,
        tamFactor: 0.8,
        marginFactor: 0.85,
        timeToValueFactor: 0.95,
        cacProxy: 0.2,
        complexity: 0.1,
        touchFactor: 0.15,
      };

      const score = calculateBuildToProfitScore(inputs);

      // High value, low cost = very high score
      expect(score).toBeGreaterThan(1000);
    });

    it('should handle low opportunity with high complexity', () => {
      const inputs: BuildToProfitInputs = {
        opportunity: 30,
        tamFactor: 0.3,
        marginFactor: 0.4,
        timeToValueFactor: 0.5,
        cacProxy: 0.8,
        complexity: 0.9,
        touchFactor: 0.85,
      };

      const score = calculateBuildToProfitScore(inputs);

      // Low value, high cost = low score
      expect(score).toBeLessThan(10);
    });

    it('should prevent division by zero', () => {
      const inputs: BuildToProfitInputs = {
        opportunity: 80,
        tamFactor: 0.7,
        marginFactor: 0.8,
        timeToValueFactor: 0.9,
        cacProxy: 0,
        complexity: 0,
        touchFactor: 0,
      };

      const score = calculateBuildToProfitScore(inputs);

      // Should not throw error or return Infinity
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeGreaterThan(0);
    });

    it('should throw error for negative inputs', () => {
      const inputs: BuildToProfitInputs = {
        opportunity: -10,
        tamFactor: 0.7,
        marginFactor: 0.8,
        timeToValueFactor: 0.9,
        cacProxy: 0.5,
        complexity: 0.4,
        touchFactor: 0.3,
      };

      expect(() => calculateBuildToProfitScore(inputs)).toThrow('All Build-to-Profit inputs must be non-negative');
    });

    it('should return 0 for zero opportunity', () => {
      const inputs: BuildToProfitInputs = {
        opportunity: 0,
        tamFactor: 0.7,
        marginFactor: 0.8,
        timeToValueFactor: 0.9,
        cacProxy: 0.5,
        complexity: 0.4,
        touchFactor: 0.3,
      };

      const score = calculateBuildToProfitScore(inputs);

      expect(score).toBe(0);
    });
  });

  describe('TAM Factor Normalization', () => {
    it('should normalize TAM correctly', () => {
      expect(normalizeTAM(1_000_000_000)).toBeCloseTo(0.1, 2); // $1B = 0.1
      expect(normalizeTAM(5_000_000_000)).toBeCloseTo(0.5, 2); // $5B = 0.5
      expect(normalizeTAM(10_000_000_000)).toBeCloseTo(1.0, 2); // $10B = 1.0
    });

    it('should cap at 1.0 for very large TAM', () => {
      expect(normalizeTAM(50_000_000_000)).toBe(1.0); // $50B capped at 1.0
    });

    it('should return 0 for zero or negative TAM', () => {
      expect(normalizeTAM(0)).toBe(0);
      expect(normalizeTAM(-1000)).toBe(0);
    });

    it('should use custom maxTam when provided', () => {
      expect(normalizeTAM(5_000_000_000, 5_000_000_000)).toBe(1.0);
    });
  });

  describe('Margin Factor Normalization', () => {
    it('should normalize margin percentage correctly', () => {
      expect(normalizeMargin(25)).toBeCloseTo(0.25, 2);
      expect(normalizeMargin(50)).toBeCloseTo(0.5, 2);
      expect(normalizeMargin(85)).toBeCloseTo(0.85, 2);
      expect(normalizeMargin(100)).toBe(1.0);
    });

    it('should cap at 1.0 for margins over 100%', () => {
      expect(normalizeMargin(150)).toBe(1.0);
    });

    it('should return 0 for zero or negative margin', () => {
      expect(normalizeMargin(0)).toBe(0);
      expect(normalizeMargin(-10)).toBe(0);
    });
  });

  describe('Complexity Factor Normalization', () => {
    it('should normalize complexity score correctly', () => {
      expect(normalizeComplexity(2)).toBeCloseTo(0.2, 2);
      expect(normalizeComplexity(5)).toBeCloseTo(0.5, 2);
      expect(normalizeComplexity(8)).toBeCloseTo(0.8, 2);
      expect(normalizeComplexity(10)).toBe(1.0);
    });

    it('should cap at 1.0 for complexity over 10', () => {
      expect(normalizeComplexity(15)).toBe(1.0);
    });

    it('should return 0 for zero or negative complexity', () => {
      expect(normalizeComplexity(0)).toBe(0);
      expect(normalizeComplexity(-5)).toBe(0);
    });
  });

  describe('Human Touch Factor Conversion', () => {
    it('should convert touch level to factor correctly', () => {
      expect(humanTouchToFactor('high')).toBe(0.9);
      expect(humanTouchToFactor('medium')).toBe(0.5);
      expect(humanTouchToFactor('low')).toBe(0.2);
    });
  });

  describe('Time to Value Factor Conversion', () => {
    it('should convert days to value to factor correctly', () => {
      expect(timeToValueToFactor(0)).toBe(1.0); // Instant
      expect(timeToValueToFactor(30)).toBeCloseTo(0.7, 1); // 30 days
      expect(timeToValueToFactor(45)).toBeCloseTo(0.55, 1); // 45 days
      expect(timeToValueToFactor(90)).toBe(0.1); // Max days
    });

    it('should return 0.1 for very slow time to value', () => {
      expect(timeToValueToFactor(180)).toBe(0.1);
      expect(timeToValueToFactor(1000)).toBe(0.1);
    });

    it('should use custom maxDays when provided', () => {
      expect(timeToValueToFactor(30, 30)).toBe(0.1);
      expect(timeToValueToFactor(15, 30)).toBeCloseTo(0.55, 1);
    });
  });

  describe('Ranking Multiple Ideas', () => {
    it('should rank ideas by score (highest first)', () => {
      const ideas = [
        {
          id: '1',
          name: 'Low opportunity, high complexity',
          inputs: {
            opportunity: 30,
            tamFactor: 0.3,
            marginFactor: 0.4,
            timeToValueFactor: 0.5,
            cacProxy: 0.8,
            complexity: 0.9,
            touchFactor: 0.85,
          },
        },
        {
          id: '2',
          name: 'High opportunity, low complexity',
          inputs: {
            opportunity: 90,
            tamFactor: 0.8,
            marginFactor: 0.85,
            timeToValueFactor: 0.95,
            cacProxy: 0.2,
            complexity: 0.1,
            touchFactor: 0.15,
          },
        },
        {
          id: '3',
          name: 'Medium opportunity, medium complexity',
          inputs: {
            opportunity: 60,
            tamFactor: 0.6,
            marginFactor: 0.65,
            timeToValueFactor: 0.7,
            cacProxy: 0.5,
            complexity: 0.5,
            touchFactor: 0.5,
          },
        },
      ];

      const ranked = rankIdeasByBuildToProfit(ideas);

      expect(ranked).toHaveLength(3);
      expect(ranked[0].id).toBe('2'); // Highest score
      expect(ranked[2].id).toBe('1'); // Lowest score
      expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
      expect(ranked[1].score).toBeGreaterThan(ranked[2].score);
    });

    it('should include all idea properties in ranked output', () => {
      const ideas = [
        {
          id: '1',
          name: 'Test Idea',
          inputs: {
            opportunity: 80,
            tamFactor: 0.7,
            marginFactor: 0.8,
            timeToValueFactor: 0.9,
            cacProxy: 0.5,
            complexity: 0.4,
            touchFactor: 0.3,
          },
        },
      ];

      const ranked = rankIdeasByBuildToProfit(ideas);

      expect(ranked[0]).toHaveProperty('id', '1');
      expect(ranked[0]).toHaveProperty('name', 'Test Idea');
      expect(ranked[0]).toHaveProperty('score');
      expect(ranked[0]).toHaveProperty('inputs');
    });

    it('should handle empty array', () => {
      const ranked = rankIdeasByBuildToProfit([]);
      expect(ranked).toEqual([]);
    });
  });

  describe('Integration: Full Formula Test', () => {
    it('should correctly apply all factors in the formula', () => {
      // Test case with known values
      const inputs: BuildToProfitInputs = {
        opportunity: 75, // Gap opportunity score
        tamFactor: normalizeTAM(3_000_000_000), // $3B market
        marginFactor: normalizeMargin(70), // 70% margin
        timeToValueFactor: timeToValueToFactor(7), // 1 week to value
        cacProxy: 0.4, // Moderate CAC
        complexity: normalizeComplexity(3), // Easy to build
        touchFactor: humanTouchToFactor('low'), // Low human touch
      };

      const score = calculateBuildToProfitScore(inputs);

      // All factors should be applied correctly
      expect(score).toBeGreaterThan(0);
      expect(Number.isFinite(score)).toBe(true);

      // Verify the score makes sense
      // High opportunity, large TAM, good margins, fast value, low cost = high score
      expect(score).toBeGreaterThan(100);
    });

    it('should handle realistic product idea scenario', () => {
      const saasIdea: BuildToProfitInputs = {
        opportunity: 82, // Strong gap in market
        tamFactor: normalizeTAM(500_000_000), // $500M TAM
        marginFactor: normalizeMargin(85), // 85% SaaS margins
        timeToValueFactor: timeToValueToFactor(1), // Instant value
        cacProxy: 0.35, // Reasonable SaaS CAC
        complexity: normalizeComplexity(4), // Moderate build complexity
        touchFactor: humanTouchToFactor('low'), // Self-serve product
      };

      const hardwareIdea: BuildToProfitInputs = {
        opportunity: 78, // Similar opportunity
        tamFactor: normalizeTAM(2_000_000_000), // $2B TAM (larger)
        marginFactor: normalizeMargin(30), // 30% hardware margins
        timeToValueFactor: timeToValueToFactor(60), // Shipping delay
        cacProxy: 0.7, // High acquisition cost
        complexity: normalizeComplexity(8), // Complex manufacturing
        touchFactor: humanTouchToFactor('high'), // Lots of support needed
      };

      const saasScore = calculateBuildToProfitScore(saasIdea);
      const hardwareScore = calculateBuildToProfitScore(hardwareIdea);

      // SaaS should score much higher despite smaller TAM
      expect(saasScore).toBeGreaterThan(hardwareScore);
    });
  });
});

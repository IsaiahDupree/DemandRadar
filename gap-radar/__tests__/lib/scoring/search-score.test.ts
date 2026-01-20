/**
 * Search Score Tests
 *
 * Tests for Google Trends-based search score calculation (UDS-001)
 * Formula: Volume * 0.4 + Growth Rate * 0.4 + Commercial Intent * 0.2
 */

import {
  calculateSearchScore,
  normalizeVolume,
  normalizeGrowth,
  calculateCommercialIntent,
  type GoogleTrendsData
} from '@/lib/scoring/search-score';

describe('Search Score (Google Trends)', () => {

  describe('calculateSearchScore', () => {
    it('returns 0 for empty data', () => {
      const data: GoogleTrendsData = {
        searchVolume: 0,
        growthRate: 0,
        relatedQueries: []
      };

      const score = calculateSearchScore(data);
      expect(score).toBe(0);
    });

    it('returns score between 0-100', () => {
      const data: GoogleTrendsData = {
        searchVolume: 5000,
        growthRate: 0.5,
        relatedQueries: ['buy crm', 'crm software price']
      };

      const score = calculateSearchScore(data);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('increases with higher search volume', () => {
      const lowVolume: GoogleTrendsData = {
        searchVolume: 100,
        growthRate: 0.2,
        relatedQueries: []
      };

      const highVolume: GoogleTrendsData = {
        searchVolume: 10000,
        growthRate: 0.2,
        relatedQueries: []
      };

      expect(calculateSearchScore(highVolume)).toBeGreaterThan(calculateSearchScore(lowVolume));
    });

    it('increases with higher growth rate', () => {
      const lowGrowth: GoogleTrendsData = {
        searchVolume: 5000,
        growthRate: 0.1,
        relatedQueries: []
      };

      const highGrowth: GoogleTrendsData = {
        searchVolume: 5000,
        growthRate: 0.8,
        relatedQueries: []
      };

      expect(calculateSearchScore(highGrowth)).toBeGreaterThan(calculateSearchScore(lowGrowth));
    });

    it('increases with commercial intent keywords', () => {
      const noIntent: GoogleTrendsData = {
        searchVolume: 5000,
        growthRate: 0.5,
        relatedQueries: ['what is crm', 'crm tutorial']
      };

      const highIntent: GoogleTrendsData = {
        searchVolume: 5000,
        growthRate: 0.5,
        relatedQueries: ['buy crm', 'crm pricing', 'best crm software']
      };

      expect(calculateSearchScore(highIntent)).toBeGreaterThan(calculateSearchScore(noIntent));
    });

    it('applies correct formula weights (40% volume, 40% growth, 20% intent)', () => {
      const data: GoogleTrendsData = {
        searchVolume: 10000,  // Should normalize to ~80
        growthRate: 0.5,      // Should normalize to ~50
        relatedQueries: ['buy test', 'test pricing'] // Should be ~60
      };

      const score = calculateSearchScore(data);

      // Expected: (80 * 0.4) + (50 * 0.4) + (60 * 0.2) = 32 + 20 + 12 = 64
      expect(score).toBeGreaterThanOrEqual(50);
      expect(score).toBeLessThanOrEqual(80);
    });
  });

  describe('normalizeVolume', () => {
    it('returns 0 for zero volume', () => {
      expect(normalizeVolume(0)).toBe(0);
    });

    it('returns score between 0-100', () => {
      expect(normalizeVolume(1000)).toBeGreaterThanOrEqual(0);
      expect(normalizeVolume(1000)).toBeLessThanOrEqual(100);
    });

    it('uses logarithmic scale for volume', () => {
      // Volume increase should have diminishing returns
      const diff1 = normalizeVolume(2000) - normalizeVolume(1000);
      const diff2 = normalizeVolume(20000) - normalizeVolume(10000);

      expect(diff1).toBeGreaterThanOrEqual(diff2);
    });

    it('caps at 100 for very high volume', () => {
      expect(normalizeVolume(1000000)).toBeLessThanOrEqual(100);
    });
  });

  describe('normalizeGrowth', () => {
    it('returns 0 for negative growth', () => {
      expect(normalizeGrowth(-0.5)).toBe(0);
    });

    it('returns score between 0-100', () => {
      expect(normalizeGrowth(0.3)).toBeGreaterThanOrEqual(0);
      expect(normalizeGrowth(0.3)).toBeLessThanOrEqual(100);
    });

    it('increases with growth rate', () => {
      expect(normalizeGrowth(0.8)).toBeGreaterThan(normalizeGrowth(0.2));
    });

    it('handles 100%+ growth (>1.0)', () => {
      expect(normalizeGrowth(1.5)).toBeGreaterThan(normalizeGrowth(0.5));
      expect(normalizeGrowth(2.0)).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateCommercialIntent', () => {
    it('returns 0 for empty queries', () => {
      expect(calculateCommercialIntent([])).toBe(0);
    });

    it('detects buy intent keywords', () => {
      const queries = ['buy crm software', 'purchase crm'];
      expect(calculateCommercialIntent(queries)).toBeGreaterThan(50);
    });

    it('detects pricing intent keywords', () => {
      const queries = ['crm pricing', 'how much does crm cost', 'crm price'];
      expect(calculateCommercialIntent(queries)).toBeGreaterThan(50);
    });

    it('detects comparison keywords', () => {
      const queries = ['best crm software', 'top crm tools', 'crm comparison'];
      expect(calculateCommercialIntent(queries)).toBeGreaterThan(40);
    });

    it('detects alternative search keywords', () => {
      const queries = ['alternative to hubspot', 'salesforce competitor'];
      expect(calculateCommercialIntent(queries)).toBeGreaterThan(40);
    });

    it('returns low score for informational queries', () => {
      const queries = ['what is crm', 'how to use crm', 'crm tutorial'];
      expect(calculateCommercialIntent(queries)).toBeLessThan(30);
    });

    it('returns higher score for more commercial queries', () => {
      const informational = ['what is crm'];
      const commercial = ['buy crm', 'crm pricing', 'best crm'];

      expect(calculateCommercialIntent(commercial))
        .toBeGreaterThan(calculateCommercialIntent(informational));
    });
  });
});

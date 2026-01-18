/**
 * Feature Gates Tests
 *
 * Tests for PAYWALL-001: Feature Gating System
 * Gate premium features behind subscription/credits with upgrade prompts
 */

import {
  checkFeatureAccess,
  FeatureName,
  FeatureAccessResult,
  getRequiredTier,
  getFeatureDescription,
} from '@/lib/feature-gates';
import type { SubscriptionTier } from '@/lib/subscription/tier-limits';

describe('feature-gates', () => {
  describe('checkFeatureAccess', () => {
    it('should allow free tier to access basic features', () => {
      const result = checkFeatureAccess('free', 'createRun');
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should block free tier from PDF export', () => {
      const result = checkFeatureAccess('free', 'pdfExport');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.requiredTier).toBe('starter');
    });

    it('should block free tier from API access', () => {
      const result = checkFeatureAccess('free', 'apiAccess');
      expect(result.allowed).toBe(false);
      expect(result.requiredTier).toBe('agency');
    });

    it('should allow starter tier to export PDF', () => {
      const result = checkFeatureAccess('starter', 'pdfExport');
      expect(result.allowed).toBe(true);
    });

    it('should block starter tier from API access', () => {
      const result = checkFeatureAccess('starter', 'apiAccess');
      expect(result.allowed).toBe(false);
      expect(result.requiredTier).toBe('agency');
    });

    it('should allow builder tier to share reports', () => {
      const result = checkFeatureAccess('builder', 'shareReports');
      expect(result.allowed).toBe(true);
    });

    it('should block builder tier from white-label', () => {
      const result = checkFeatureAccess('builder', 'whiteLabel');
      expect(result.allowed).toBe(false);
      expect(result.requiredTier).toBe('studio');
    });

    it('should allow agency tier API access', () => {
      const result = checkFeatureAccess('agency', 'apiAccess');
      expect(result.allowed).toBe(true);
    });

    it('should allow studio tier all features', () => {
      const features: FeatureName[] = [
        'createRun',
        'pdfExport',
        'csvExport',
        'jsonExport',
        'shareReports',
        'whiteLabel',
        'apiAccess',
        'demandBrief',
        'googleAds',
        'ugc',
      ];

      features.forEach((feature) => {
        const result = checkFeatureAccess('studio', feature);
        expect(result.allowed).toBe(true);
      });
    });

    it('should return upgrade suggestion when blocked', () => {
      const result = checkFeatureAccess('free', 'pdfExport');
      expect(result.allowed).toBe(false);
      expect(result.upgradeSuggestion).toBeDefined();
      expect(result.upgradeSuggestion).toContain('Starter');
    });
  });

  describe('getRequiredTier', () => {
    it('should return lowest tier for createRun', () => {
      expect(getRequiredTier('createRun')).toBe('free');
    });

    it('should return starter for PDF export', () => {
      expect(getRequiredTier('pdfExport')).toBe('starter');
    });

    it('should return builder for demand brief', () => {
      expect(getRequiredTier('demandBrief')).toBe('starter');
    });

    it('should return agency for API access', () => {
      expect(getRequiredTier('apiAccess')).toBe('agency');
    });

    it('should return studio for white-label', () => {
      expect(getRequiredTier('whiteLabel')).toBe('studio');
    });
  });

  describe('getFeatureDescription', () => {
    it('should return description for each feature', () => {
      const features: FeatureName[] = [
        'createRun',
        'pdfExport',
        'csvExport',
        'shareReports',
        'apiAccess',
        'whiteLabel',
      ];

      features.forEach((feature) => {
        const description = getFeatureDescription(feature);
        expect(description).toBeDefined();
        expect(description.length).toBeGreaterThan(0);
      });
    });

    it('should return meaningful descriptions', () => {
      expect(getFeatureDescription('pdfExport')).toContain('PDF');
      expect(getFeatureDescription('apiAccess')).toContain('API');
      expect(getFeatureDescription('whiteLabel')).toContain('white-label');
    });
  });

  describe('FeatureAccessResult', () => {
    it('should have correct structure when allowed', () => {
      const result = checkFeatureAccess('starter', 'pdfExport');

      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('feature');
      expect(result.feature).toBe('pdfExport');
    });

    it('should have upgrade info when blocked', () => {
      const result = checkFeatureAccess('free', 'apiAccess');

      expect(result.allowed).toBe(false);
      expect(result).toHaveProperty('requiredTier');
      expect(result).toHaveProperty('reason');
      expect(result).toHaveProperty('upgradeSuggestion');
    });
  });
});

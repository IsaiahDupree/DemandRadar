/**
 * Test: Conversion Optimization (META-008)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for Meta Pixel conversion optimization features:
 * - Value optimization for Purchase events
 * - Advanced matching with user data
 * - Predicted LTV tracking
 * - Conversion value rules
 */

import {
  trackPurchaseWithValue,
  trackWithAdvancedMatching,
  setConversionValue,
  trackPredictedLTV,
} from '@/lib/meta-pixel';

// Mock window.fbq
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

describe('Conversion Optimization (META-008)', () => {
  let mockFbq: jest.Mock;

  beforeEach(() => {
    mockFbq = jest.fn();
    window.fbq = mockFbq;
  });

  afterEach(() => {
    delete (window as any).fbq;
    delete (window as any)._fbq;
  });

  describe('trackPurchaseWithValue', () => {
    it('should track Purchase event with value and currency', () => {
      trackPurchaseWithValue({
        value: 99.99,
        currency: 'USD',
        content_ids: ['premium-plan'],
        content_name: 'Premium Plan',
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 99.99,
        currency: 'USD',
        content_ids: ['premium-plan'],
        content_name: 'Premium Plan',
      });
    });

    it('should default to USD currency if not provided', () => {
      trackPurchaseWithValue({
        value: 49.99,
        content_ids: ['starter-plan'],
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 49.99,
        currency: 'USD',
        content_ids: ['starter-plan'],
      });
    });

    it('should include transaction_id for deduplication', () => {
      trackPurchaseWithValue({
        value: 199.99,
        currency: 'USD',
        transaction_id: 'order-12345',
        content_ids: ['enterprise-plan'],
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 199.99,
        currency: 'USD',
        transaction_id: 'order-12345',
        content_ids: ['enterprise-plan'],
      });
    });

    it('should include num_items for multi-item purchases', () => {
      trackPurchaseWithValue({
        value: 299.98,
        currency: 'USD',
        content_ids: ['premium-plan', 'addon-seats'],
        num_items: 2,
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 299.98,
        currency: 'USD',
        content_ids: ['premium-plan', 'addon-seats'],
        num_items: 2,
      });
    });
  });

  describe('trackWithAdvancedMatching', () => {
    it('should track event with advanced matching user data', () => {
      trackWithAdvancedMatching('Purchase', {
        value: 99.99,
        currency: 'USD',
      }, {
        em: 'customer@example.com',
        fn: 'John',
        ln: 'Doe',
        ct: 'San Francisco',
        st: 'CA',
        country: 'US',
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 99.99,
        currency: 'USD',
      }, {
        em: 'customer@example.com',
        fn: 'John',
        ln: 'Doe',
        ct: 'San Francisco',
        st: 'CA',
        country: 'US',
      });
    });

    it('should work with partial user data', () => {
      trackWithAdvancedMatching('Lead', {}, {
        em: 'lead@example.com',
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', {}, {
        em: 'lead@example.com',
      });
    });

    it('should handle empty user data', () => {
      trackWithAdvancedMatching('ViewContent', {
        content_type: 'product',
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'ViewContent', {
        content_type: 'product',
      }, {});
    });
  });

  describe('setConversionValue', () => {
    it('should set custom conversion value for events', () => {
      setConversionValue('Lead', 25.00);

      // Should store the value rule internally
      // Next Lead event should use this value
      trackWithAdvancedMatching('Lead', {});

      expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', {
        value: 25.00,
        currency: 'USD',
      }, {});
    });

    it('should support different currencies', () => {
      setConversionValue('Lead', 20.00, 'EUR');

      trackWithAdvancedMatching('Lead', {});

      expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', {
        value: 20.00,
        currency: 'EUR',
      }, {});
    });

    it('should allow different values for different events', () => {
      setConversionValue('Lead', 25.00);
      setConversionValue('CompleteRegistration', 50.00);

      trackWithAdvancedMatching('Lead', {});
      trackWithAdvancedMatching('CompleteRegistration', {});

      expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', {
        value: 25.00,
        currency: 'USD',
      }, {});

      expect(mockFbq).toHaveBeenCalledWith('track', 'CompleteRegistration', {
        value: 50.00,
        currency: 'USD',
      }, {});
    });

    it('should not override explicitly passed value', () => {
      setConversionValue('Purchase', 100.00);

      trackPurchaseWithValue({
        value: 199.99,
        currency: 'USD',
      });

      // Explicit value takes precedence
      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 199.99,
        currency: 'USD',
      });
    });
  });

  describe('trackPredictedLTV', () => {
    it('should track predicted lifetime value for new customers', () => {
      trackPredictedLTV({
        user_id: 'user-123',
        predicted_ltv: 500.00,
        currency: 'USD',
      });

      expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'PredictedLTV', {
        user_id: 'user-123',
        predicted_ltv: 500.00,
        currency: 'USD',
      });
    });

    it('should default to USD if currency not provided', () => {
      trackPredictedLTV({
        user_id: 'user-456',
        predicted_ltv: 750.00,
      });

      expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'PredictedLTV', {
        user_id: 'user-456',
        predicted_ltv: 750.00,
        currency: 'USD',
      });
    });

    it('should include subscription_tier for segmentation', () => {
      trackPredictedLTV({
        user_id: 'user-789',
        predicted_ltv: 2000.00,
        currency: 'USD',
        subscription_tier: 'enterprise',
      });

      expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'PredictedLTV', {
        user_id: 'user-789',
        predicted_ltv: 2000.00,
        currency: 'USD',
        subscription_tier: 'enterprise',
      });
    });
  });

  describe('Value-based optimization', () => {
    it('should enable value optimization by including value in all conversion events', () => {
      // Free trial signup should have estimated value
      setConversionValue('Lead', 15.00);
      trackWithAdvancedMatching('Lead', {});

      expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', {
        value: 15.00,
        currency: 'USD',
      }, {});

      // Registration should have higher value
      setConversionValue('CompleteRegistration', 30.00);
      trackWithAdvancedMatching('CompleteRegistration', {});

      expect(mockFbq).toHaveBeenCalledWith('track', 'CompleteRegistration', {
        value: 30.00,
        currency: 'USD',
      }, {});
    });

    it('should track actual purchase value for revenue optimization', () => {
      trackPurchaseWithValue({
        value: 99.99,
        currency: 'USD',
        transaction_id: 'order-abc123',
        content_ids: ['premium-monthly'],
        content_name: 'Premium Plan - Monthly',
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', {
        value: 99.99,
        currency: 'USD',
        transaction_id: 'order-abc123',
        content_ids: ['premium-monthly'],
        content_name: 'Premium Plan - Monthly',
      });
    });
  });

  describe('Error handling', () => {
    it('should not throw if window.fbq is not initialized', () => {
      delete (window as any).fbq;

      expect(() => {
        trackPurchaseWithValue({ value: 99.99 });
      }).not.toThrow();

      expect(() => {
        trackWithAdvancedMatching('Lead', {});
      }).not.toThrow();

      expect(() => {
        trackPredictedLTV({ user_id: 'user-123', predicted_ltv: 500 });
      }).not.toThrow();
    });

    it('should handle invalid values gracefully', () => {
      expect(() => {
        trackPurchaseWithValue({ value: -10 });
      }).not.toThrow();

      expect(() => {
        setConversionValue('Lead', NaN);
      }).not.toThrow();
    });
  });
});

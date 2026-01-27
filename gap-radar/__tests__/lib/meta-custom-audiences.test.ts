/**
 * Tests for META-007: Custom Audiences Setup
 * ============================================
 *
 * Custom Audiences allow targeting specific user groups based on behavior.
 * This test suite verifies audience configuration and event parameter setup.
 */

import {
  defineCustomAudience,
  getAudienceEventParameters,
  trackForAudience,
  type CustomAudienceConfig,
} from '@/lib/meta-custom-audiences';

describe('META-007: Custom Audiences Setup', () => {
  describe('defineCustomAudience', () => {
    it('should create a custom audience configuration', () => {
      const audience = defineCustomAudience({
        name: 'Active Users',
        description: 'Users who have created at least one report',
        events: ['run_created', 'run_completed'],
        timeWindow: 30, // 30 days
      });

      expect(audience).toEqual({
        name: 'Active Users',
        description: 'Users who have created at least one report',
        events: ['run_created', 'run_completed'],
        timeWindow: 30,
      });
    });

    it('should support value-based audiences', () => {
      const audience = defineCustomAudience({
        name: 'High-Value Customers',
        description: 'Customers who spent over $100',
        events: ['purchase_completed'],
        timeWindow: 180,
        valueCondition: {
          field: 'value',
          operator: 'greater_than',
          value: 100,
        },
      });

      expect(audience.valueCondition).toEqual({
        field: 'value',
        operator: 'greater_than',
        value: 100,
      });
    });

    it('should support frequency-based audiences', () => {
      const audience = defineCustomAudience({
        name: 'Power Users',
        description: 'Users who created 5+ reports',
        events: ['run_created'],
        timeWindow: 90,
        frequencyCondition: {
          minOccurrences: 5,
        },
      });

      expect(audience.frequencyCondition).toEqual({
        minOccurrences: 5,
      });
    });
  });

  describe('getAudienceEventParameters', () => {
    it('should return enhanced parameters for audience tracking', () => {
      const baseParams = {
        value: 99,
        currency: 'USD',
      };

      const params = getAudienceEventParameters('purchase_completed', baseParams, {
        audienceName: 'High-Value Customers',
      });

      expect(params).toMatchObject({
        value: 99,
        currency: 'USD',
      });
      // Should include content_category for audience segmentation
      expect(params.content_category).toBeDefined();
    });

    it('should add content_category based on event type', () => {
      const params = getAudienceEventParameters('run_completed', {
        query: 'AI chatbots',
      });

      expect(params.content_category).toBe('market_analysis');
    });

    it('should support custom category override', () => {
      const params = getAudienceEventParameters(
        'run_completed',
        { query: 'AI chatbots' },
        { contentCategory: 'custom_category' }
      );

      expect(params.content_category).toBe('custom_category');
    });
  });

  describe('trackForAudience', () => {
    let mockFbq: jest.Mock;

    beforeEach(() => {
      // Mock window.fbq
      mockFbq = jest.fn();
      global.window = global.window || ({} as any);
      (global.window as any).fbq = mockFbq;
    });

    afterEach(() => {
      // Clean up
      delete (global.window as any).fbq;
    });

    it('should track event with audience parameters', () => {
      const audience: CustomAudienceConfig = {
        name: 'Active Users',
        description: 'Users who created reports',
        events: ['run_created'],
        timeWindow: 30,
      };

      trackForAudience(audience, 'run_created', {
        runId: 'run-123',
        query: 'AI chatbots',
      });

      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        'InitiateCheckout',
        expect.objectContaining({
          content_ids: ['run-123'],
          content_name: 'AI chatbots',
          content_category: expect.any(String),
        })
      );
    });

    it('should only track if event is in audience config', () => {
      const audience: CustomAudienceConfig = {
        name: 'Purchasers',
        description: 'Users who made a purchase',
        events: ['purchase_completed'],
        timeWindow: 180,
      };

      trackForAudience(audience, 'run_created', { runId: 'run-123' });

      // Should not track since run_created is not in the audience events
      expect(mockFbq).not.toHaveBeenCalled();
    });

    it('should track with value condition parameters', () => {
      const audience: CustomAudienceConfig = {
        name: 'High-Value Customers',
        description: 'Customers who spent over $100',
        events: ['purchase_completed'],
        timeWindow: 180,
        valueCondition: {
          field: 'value',
          operator: 'greater_than',
          value: 100,
        },
      };

      trackForAudience(audience, 'purchase_completed', {
        orderId: 'order-123',
        value: 150,
        currency: 'USD',
      });

      expect(mockFbq).toHaveBeenCalledWith(
        'track',
        'Purchase',
        expect.objectContaining({
          value: 150,
          currency: 'USD',
        })
      );
    });

    it('should not call fbq if window is undefined', () => {
      global.window = undefined as any;

      const audience: CustomAudienceConfig = {
        name: 'Active Users',
        description: 'Users who created reports',
        events: ['run_created'],
        timeWindow: 30,
      };

      // Should not throw error
      expect(() => {
        trackForAudience(audience, 'run_created', { runId: 'run-123' });
      }).not.toThrow();
    });
  });

  describe('Predefined Audiences', () => {
    it('should have predefined audience configurations', () => {
      // This tests that we export common audience configs
      const { PREDEFINED_AUDIENCES } = require('@/lib/meta-custom-audiences');

      expect(PREDEFINED_AUDIENCES).toBeDefined();
      expect(PREDEFINED_AUDIENCES.ACTIVE_USERS).toBeDefined();
      expect(PREDEFINED_AUDIENCES.CONVERTERS).toBeDefined();
      expect(PREDEFINED_AUDIENCES.HIGH_VALUE_CUSTOMERS).toBeDefined();
    });
  });
});

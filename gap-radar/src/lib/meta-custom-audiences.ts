/**
 * Meta Custom Audiences Setup (META-007)
 * =======================================
 *
 * Utilities for configuring and tracking Custom Audiences in Meta/Facebook Ads.
 *
 * Custom Audiences allow targeting specific user groups based on behavior tracked
 * by the Meta Pixel. This module provides configuration and tracking helpers.
 *
 * Official docs: https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences
 */

import { mapToMetaEvent, fbq } from './meta-pixel';

/**
 * Value Condition for audience filtering
 */
export interface ValueCondition {
  field: string;
  operator: 'greater_than' | 'less_than' | 'equal_to' | 'between';
  value: number;
  maxValue?: number; // For 'between' operator
}

/**
 * Frequency Condition for audience filtering
 */
export interface FrequencyCondition {
  minOccurrences: number;
  maxOccurrences?: number;
}

/**
 * Custom Audience Configuration
 */
export interface CustomAudienceConfig {
  name: string;
  description: string;
  events: string[]; // GapRadar event names
  timeWindow: number; // Days to look back
  valueCondition?: ValueCondition;
  frequencyCondition?: FrequencyCondition;
}

/**
 * Options for audience event tracking
 */
export interface AudienceTrackingOptions {
  audienceName?: string;
  contentCategory?: string;
}

/**
 * Define a Custom Audience Configuration
 *
 * Creates a configuration object for a custom audience that can be used
 * with the Meta Pixel to segment users based on behavior.
 *
 * @param config - The audience configuration
 * @returns The complete audience configuration
 *
 * @example
 * const activeUsers = defineCustomAudience({
 *   name: 'Active Users',
 *   description: 'Users who created at least one report',
 *   events: ['run_created', 'run_completed'],
 *   timeWindow: 30
 * });
 *
 * @example
 * const highValueCustomers = defineCustomAudience({
 *   name: 'High-Value Customers',
 *   description: 'Customers who spent over $100',
 *   events: ['purchase_completed'],
 *   timeWindow: 180,
 *   valueCondition: {
 *     field: 'value',
 *     operator: 'greater_than',
 *     value: 100
 *   }
 * });
 */
export function defineCustomAudience(
  config: CustomAudienceConfig
): CustomAudienceConfig {
  return {
    name: config.name,
    description: config.description,
    events: config.events,
    timeWindow: config.timeWindow,
    valueCondition: config.valueCondition,
    frequencyCondition: config.frequencyCondition,
  };
}

/**
 * Get Enhanced Event Parameters for Audience Tracking
 *
 * Enhances event parameters with additional fields that help Meta
 * create more accurate custom audiences. Adds content_category
 * and other segmentation fields.
 *
 * @param gapRadarEvent - GapRadar event name
 * @param baseParams - Base event parameters
 * @param options - Audience tracking options
 * @returns Enhanced parameters for Meta Pixel
 *
 * @example
 * const params = getAudienceEventParameters('purchase_completed', {
 *   value: 99,
 *   currency: 'USD'
 * }, {
 *   audienceName: 'High-Value Customers'
 * });
 */
export function getAudienceEventParameters(
  gapRadarEvent: string,
  baseParams: Record<string, any>,
  options?: AudienceTrackingOptions
): Record<string, any> {
  // Start with base parameters
  const enhancedParams = { ...baseParams };

  // Add content_category based on event type or custom override
  if (options?.contentCategory) {
    enhancedParams.content_category = options.contentCategory;
  } else {
    // Infer category from event type
    switch (gapRadarEvent) {
      case 'run_created':
      case 'run_completed':
      case 'report_viewed':
        enhancedParams.content_category = 'market_analysis';
        break;
      case 'purchase_completed':
      case 'checkout_started':
        enhancedParams.content_category = 'purchase';
        break;
      case 'signup_start':
      case 'signup_complete':
        enhancedParams.content_category = 'registration';
        break;
      default:
        enhancedParams.content_category = 'engagement';
    }
  }

  return enhancedParams;
}

/**
 * Track Event for Custom Audience
 *
 * Tracks an event for a specific custom audience configuration.
 * Only tracks if the event is part of the audience's event list.
 *
 * @param audience - The custom audience configuration
 * @param gapRadarEvent - GapRadar event name
 * @param properties - Event properties
 *
 * @example
 * const activeUsers = defineCustomAudience({
 *   name: 'Active Users',
 *   description: 'Users who created reports',
 *   events: ['run_created'],
 *   timeWindow: 30
 * });
 *
 * trackForAudience(activeUsers, 'run_created', {
 *   runId: 'run-123',
 *   query: 'AI chatbots'
 * });
 */
export function trackForAudience(
  audience: CustomAudienceConfig,
  gapRadarEvent: string,
  properties: Record<string, any>
): void {
  // Skip if not in browser
  if (typeof window === 'undefined' || !window.fbq) {
    return;
  }

  // Only track if event is in the audience's event list
  if (!audience.events.includes(gapRadarEvent)) {
    return;
  }

  // Get enhanced parameters for audience tracking
  const enhancedParams = getAudienceEventParameters(gapRadarEvent, properties, {
    audienceName: audience.name,
  });

  // Map to Meta event and track
  const mapping = mapToMetaEvent(gapRadarEvent, enhancedParams);

  if (mapping) {
    // Merge enhanced params (like content_category) with mapped parameters
    const finalParameters = {
      ...mapping.parameters,
      content_category: enhancedParams.content_category,
    };
    fbq('track', mapping.eventName, finalParameters);
  }
}

/**
 * Predefined Custom Audience Configurations
 *
 * Common audience configurations that can be used out of the box.
 */
export const PREDEFINED_AUDIENCES = {
  /**
   * Active Users - Users who have created at least one report
   */
  ACTIVE_USERS: defineCustomAudience({
    name: 'Active Users',
    description: 'Users who have created at least one report in the last 30 days',
    events: ['run_created', 'run_completed'],
    timeWindow: 30,
  }),

  /**
   * Converters - Users who completed signup
   */
  CONVERTERS: defineCustomAudience({
    name: 'Converters',
    description: 'Users who completed the signup process',
    events: ['signup_complete'],
    timeWindow: 90,
  }),

  /**
   * High-Value Customers - Customers who spent over $100
   */
  HIGH_VALUE_CUSTOMERS: defineCustomAudience({
    name: 'High-Value Customers',
    description: 'Customers who spent over $100',
    events: ['purchase_completed'],
    timeWindow: 180,
    valueCondition: {
      field: 'value',
      operator: 'greater_than',
      value: 100,
    },
  }),

  /**
   * Power Users - Users who created 5+ reports
   */
  POWER_USERS: defineCustomAudience({
    name: 'Power Users',
    description: 'Users who created 5 or more reports',
    events: ['run_created'],
    timeWindow: 90,
    frequencyCondition: {
      minOccurrences: 5,
    },
  }),

  /**
   * Recent Purchasers - Users who made a purchase in the last 30 days
   */
  RECENT_PURCHASERS: defineCustomAudience({
    name: 'Recent Purchasers',
    description: 'Users who made a purchase in the last 30 days',
    events: ['purchase_completed'],
    timeWindow: 30,
  }),
};

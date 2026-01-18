/**
 * Feature Gating System
 *
 * Feature: PAYWALL-001 - Gate premium features behind subscription/credits
 *
 * This module provides centralized feature gating logic that determines
 * whether a user can access specific features based on their subscription tier.
 * It integrates with the tier-limits system and provides upgrade prompts.
 */

import type { SubscriptionTier } from './subscription/tier-limits';
import {
  getTierLimits,
  getTierName,
  getTierPrice,
  getUpgradeSuggestion,
  isTierAtLeast,
} from './subscription/tier-limits';

/**
 * All feature names that can be gated
 */
export type FeatureName =
  | 'createRun'
  | 'pdfExport'
  | 'csvExport'
  | 'jsonExport'
  | 'shareReports'
  | 'whiteLabel'
  | 'apiAccess'
  | 'demandBrief'
  | 'googleAds'
  | 'ugc'
  | 'demandAlerts'
  | 'competitorAlerts'
  | 'trendAlerts';

/**
 * Result of a feature access check
 */
export interface FeatureAccessResult {
  allowed: boolean;
  feature: FeatureName;
  requiredTier?: SubscriptionTier;
  reason?: string;
  upgradeSuggestion?: string;
}

/**
 * Mapping of features to their minimum required tier
 */
const FEATURE_TIER_REQUIREMENTS: Record<FeatureName, SubscriptionTier> = {
  createRun: 'free', // All tiers can create runs (limited by count)
  pdfExport: 'starter',
  csvExport: 'starter',
  jsonExport: 'builder',
  shareReports: 'builder',
  whiteLabel: 'studio',
  apiAccess: 'agency',
  demandBrief: 'starter',
  googleAds: 'starter',
  ugc: 'starter',
  demandAlerts: 'builder',
  competitorAlerts: 'builder',
  trendAlerts: 'builder',
};

/**
 * Human-readable descriptions for each feature
 */
const FEATURE_DESCRIPTIONS: Record<FeatureName, string> = {
  createRun: 'Create analysis runs',
  pdfExport: 'Export reports as PDF',
  csvExport: 'Export data as CSV',
  jsonExport: 'Export data as JSON',
  shareReports: 'Share reports with public links',
  whiteLabel: 'Generate white-label reports',
  apiAccess: 'Access the API',
  demandBrief: 'Track niches with weekly Demand Briefs',
  googleAds: 'Access Google Ads data',
  ugc: 'Access UGC (TikTok/Instagram) data',
  demandAlerts: 'Receive demand alerts',
  competitorAlerts: 'Receive competitor alerts',
  trendAlerts: 'Receive trend alerts',
};

/**
 * Check if a user's subscription tier allows access to a specific feature
 *
 * @param currentTier - User's current subscription tier
 * @param feature - Feature to check access for
 * @returns FeatureAccessResult with allowed status and upgrade information
 *
 * @example
 * ```ts
 * const result = checkFeatureAccess('free', 'pdfExport');
 * if (!result.allowed) {
 *   // Show upgrade prompt
 *   console.log(result.reason);
 *   console.log(result.upgradeSuggestion);
 * }
 * ```
 */
export function checkFeatureAccess(
  currentTier: SubscriptionTier,
  feature: FeatureName
): FeatureAccessResult {
  const requiredTier = FEATURE_TIER_REQUIREMENTS[feature];
  const allowed = isTierAtLeast(currentTier, requiredTier);

  if (allowed) {
    return {
      allowed: true,
      feature,
    };
  }

  // User doesn't have access - provide upgrade information
  const featureDescription = FEATURE_DESCRIPTIONS[feature];
  const requiredTierName = getTierName(requiredTier);
  const requiredPrice = getTierPrice(requiredTier);

  const reason = `${featureDescription} requires ${requiredTierName} plan or higher.`;

  // Get personalized upgrade suggestion
  const upgrade = getUpgradeSuggestion(currentTier);
  const upgradeSuggestion = upgrade
    ? `Upgrade to ${getTierName(upgrade.tier)} ($${getTierPrice(upgrade.tier)}/mo) to unlock this feature. ${upgrade.reason}`
    : `Upgrade to ${requiredTierName} ($${requiredPrice}/mo) to unlock this feature.`;

  return {
    allowed: false,
    feature,
    requiredTier,
    reason,
    upgradeSuggestion,
  };
}

/**
 * Get the minimum required tier for a feature
 *
 * @param feature - Feature name
 * @returns Minimum subscription tier required
 */
export function getRequiredTier(feature: FeatureName): SubscriptionTier {
  return FEATURE_TIER_REQUIREMENTS[feature];
}

/**
 * Get human-readable description of a feature
 *
 * @param feature - Feature name
 * @returns Description string
 */
export function getFeatureDescription(feature: FeatureName): string {
  return FEATURE_DESCRIPTIONS[feature];
}

/**
 * Check multiple features at once
 *
 * @param currentTier - User's current subscription tier
 * @param features - Array of features to check
 * @returns Map of feature names to access results
 */
export function checkMultipleFeatures(
  currentTier: SubscriptionTier,
  features: FeatureName[]
): Map<FeatureName, FeatureAccessResult> {
  const results = new Map<FeatureName, FeatureAccessResult>();

  features.forEach((feature) => {
    results.set(feature, checkFeatureAccess(currentTier, feature));
  });

  return results;
}

/**
 * Get all blocked features for a tier
 *
 * @param currentTier - User's current subscription tier
 * @returns Array of features the user cannot access
 */
export function getBlockedFeatures(currentTier: SubscriptionTier): FeatureName[] {
  return (Object.keys(FEATURE_TIER_REQUIREMENTS) as FeatureName[]).filter(
    (feature) => !checkFeatureAccess(currentTier, feature).allowed
  );
}

/**
 * Get all available features for a tier
 *
 * @param currentTier - User's current subscription tier
 * @returns Array of features the user can access
 */
export function getAvailableFeatures(currentTier: SubscriptionTier): FeatureName[] {
  return (Object.keys(FEATURE_TIER_REQUIREMENTS) as FeatureName[]).filter(
    (feature) => checkFeatureAccess(currentTier, feature).allowed
  );
}

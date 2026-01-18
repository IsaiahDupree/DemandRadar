/**
 * Demand Brief Add-Ons Configuration
 *
 * BRIEF-015: Defines add-on packages for demand brief subscriptions:
 * - Ad Angle Pack: 10 additional ad angles for your niche
 * - Landing Page Rewrites: 5 landing page variations
 * - Competitor Watchlist: Monthly competitor monitoring
 */

import { ADDON_PACKAGES, AddonPackageKey } from '@/lib/stripe';

export type { AddonPackageKey };

export interface AddonPackage {
  name: string;
  description: string;
  price: number;
  priceId?: string;
}

/**
 * Gets all available add-on packages
 */
export function getAllAddons(): Record<AddonPackageKey, AddonPackage> {
  return ADDON_PACKAGES;
}

/**
 * Gets a specific add-on package by key
 */
export function getAddonByKey(key: AddonPackageKey): AddonPackage {
  const addon = ADDON_PACKAGES[key];

  if (!addon) {
    throw new Error(`Invalid addon key: ${key}`);
  }

  return addon;
}

/**
 * Gets the list of add-ons as an array
 */
export function getAddonsArray(): Array<AddonPackage & { key: AddonPackageKey }> {
  return Object.entries(ADDON_PACKAGES).map(([key, addon]) => ({
    key: key as AddonPackageKey,
    ...addon,
  }));
}

/**
 * Checks if an add-on is available for purchase
 */
export function isAddonAvailable(key: AddonPackageKey): boolean {
  const addon = ADDON_PACKAGES[key];
  return !!addon && !!addon.priceId;
}

/**
 * Gets the total price for multiple add-ons
 */
export function getTotalAddonPrice(addons: AddonPackageKey[]): number {
  return addons.reduce((total, key) => {
    const addon = ADDON_PACKAGES[key];
    return total + (addon?.price || 0);
  }, 0);
}

/**
 * Validates if a given key is a valid addon
 */
export function isValidAddonKey(key: string): key is AddonPackageKey {
  return key in ADDON_PACKAGES;
}

/**
 * Feature unlocking logic for add-ons
 *
 * This function would typically check the user's purchased add-ons
 * and return whether they have access to a specific feature.
 */
export interface UserAddons {
  ad_angles?: boolean;
  landing_rewrites?: boolean;
  competitor_watch?: boolean;
}

export function hasAddonAccess(
  userAddons: UserAddons,
  requiredAddon: AddonPackageKey
): boolean {
  return !!userAddons[requiredAddon];
}

/**
 * Gets the features unlocked by a specific add-on
 */
export function getAddonFeatures(key: AddonPackageKey): string[] {
  switch (key) {
    case 'ad_angles':
      return [
        '10 additional AI-generated ad angles',
        'Competitor angle analysis',
        'Hook variations',
        'CTA recommendations',
      ];
    case 'landing_rewrites':
      return [
        '5 landing page variations',
        'A/B test suggestions',
        'Conversion optimization tips',
        'Copy-paste ready HTML',
      ];
    case 'competitor_watch':
      return [
        'Monthly competitor monitoring',
        'Price change alerts',
        'Feature update notifications',
        'Ad strategy changes',
        'Positioning shifts',
      ];
    default:
      return [];
  }
}

/**
 * Gets the recommended add-ons based on user's plan tier
 */
export function getRecommendedAddons(tier: string): AddonPackageKey[] {
  switch (tier) {
    case 'starter':
      return ['ad_angles'];
    case 'builder':
      return ['ad_angles', 'landing_rewrites'];
    case 'agency':
      return ['competitor_watch', 'landing_rewrites'];
    default:
      return [];
  }
}

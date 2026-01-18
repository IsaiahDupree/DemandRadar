/**
 * UpsellBanner Component
 *
 * Feature: UPSELL-001 - Persistent upgrade banner with contextual messaging
 *
 * Shows a dismissible banner encouraging users to upgrade based on their current tier.
 * - Free tier: Encourage upgrade to Starter for more runs
 * - Starter tier: Encourage upgrade to Builder for more features
 * - Builder tier: Encourage upgrade to Agency for API access
 * - Agency/Studio: No banner shown
 *
 * Dismissal is persisted in localStorage to avoid showing repeatedly.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SubscriptionTier } from '@/lib/subscription/tier-limits';

export interface UpsellBannerProps {
  /** Current user's subscription tier */
  tier: SubscriptionTier;
  /** Optional custom message override */
  message?: string;
}

interface TierMessage {
  title: string;
  description: string;
  targetTier: string;
  targetPrice: number;
}

const TIER_MESSAGES: Record<Exclude<SubscriptionTier, 'agency' | 'studio'>, TierMessage> = {
  free: {
    title: 'Upgrade to unlock full market insights',
    description: 'Get 5 runs per month, PDF exports, and UGC insights with the Starter plan.',
    targetTier: 'Starter',
    targetPrice: 29,
  },
  starter: {
    title: 'Scale your research with Builder',
    description: '15 runs per month, share reports, and track 3 niches with demand alerts.',
    targetTier: 'Builder',
    targetPrice: 99,
  },
  builder: {
    title: 'Go professional with Agency',
    description: '50 runs per month, API access, track 10 niches, and priority support.',
    targetTier: 'Agency',
    targetPrice: 249,
  },
};

const DISMISSED_BANNER_KEY = 'dismissedBanners';

/**
 * Check if banner has been dismissed
 */
function isDismissed(): boolean {
  try {
    const dismissedBanners = localStorage.getItem(DISMISSED_BANNER_KEY);
    if (!dismissedBanners) return false;

    const parsed = JSON.parse(dismissedBanners);
    return parsed.upsell === true;
  } catch (error) {
    // If localStorage is disabled or parsing fails, show banner
    return false;
  }
}

/**
 * Mark banner as dismissed
 */
function markDismissed(): void {
  try {
    const dismissedBanners = JSON.parse(localStorage.getItem(DISMISSED_BANNER_KEY) || '{}');
    dismissedBanners.upsell = true;
    localStorage.setItem(DISMISSED_BANNER_KEY, JSON.stringify(dismissedBanners));
  } catch (error) {
    // Silently fail if localStorage is disabled
    console.warn('Failed to persist banner dismissal:', error);
  }
}

/**
 * UpsellBanner Component
 */
export function UpsellBanner({ tier, message }: UpsellBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if banner should be shown
    const shouldShow = !isDismissed() && (tier === 'free' || tier === 'starter' || tier === 'builder');
    setVisible(shouldShow);
  }, [tier]);

  const handleDismiss = () => {
    markDismissed();
    setVisible(false);
  };

  // Don't render for agency/studio tiers or if dismissed
  if (!visible || tier === 'agency' || tier === 'studio') {
    return null;
  }

  const tierMessage = TIER_MESSAGES[tier];

  return (
    <div
      role="banner"
      className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-primary/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="hidden sm:flex items-center justify-center rounded-full bg-primary/10 p-2 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {message || tierMessage.title}
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
                {tierMessage.description}
              </p>
            </div>
          </div>

          {/* CTA and Dismiss */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              asChild
              size="sm"
              variant="default"
              className="hidden sm:inline-flex"
            >
              <Link href="/pricing">
                Upgrade to {tierMessage.targetTier}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="default"
              className="sm:hidden"
            >
              <Link href="/pricing">
                Upgrade
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

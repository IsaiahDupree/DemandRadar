/**
 * UpgradePrompt Component
 *
 * Feature: PAYWALL-001 - Upgrade modal shown when user tries to access blocked feature
 *
 * Displays when a user attempts to use a feature they don't have access to,
 * showing the required tier, pricing, and a call-to-action to upgrade.
 */

'use client';

import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FeatureName } from '@/lib/feature-gates';
import type { SubscriptionTier } from '@/lib/subscription/tier-limits';
import { checkFeatureAccess, getFeatureDescription } from '@/lib/feature-gates';
import { getTierName, getTierPrice } from '@/lib/subscription/tier-limits';

export interface UpgradePromptProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Current user's subscription tier */
  currentTier: SubscriptionTier;
  /** Feature that triggered the upgrade prompt */
  feature: FeatureName;
  /** Optional custom message to display */
  customMessage?: string;
  /** Optional custom upgrade handler (defaults to navigating to /pricing) */
  onUpgrade?: () => void;
}

/**
 * Get tier-specific benefits for display
 */
function getTierBenefits(tier: SubscriptionTier): string[] {
  const benefits: Record<SubscriptionTier, string[]> = {
    free: ['1 free analysis run', 'Basic data sources', 'Community support'],
    starter: [
      '5 runs per month',
      'PDF & CSV exports',
      'Google Ads data',
      'UGC insights',
      'Track 1 niche',
    ],
    builder: [
      '15 runs per month',
      'All exports (PDF, CSV, JSON)',
      'Share reports',
      'Track 3 niches',
      'Demand & trend alerts',
    ],
    agency: [
      '50 runs per month',
      'API access',
      'Track 10 niches',
      'Priority support',
      'All data sources',
    ],
    studio: [
      '200 runs per month',
      'White-label reports',
      'Track 25 niches',
      'Dedicated support',
      'Everything included',
    ],
  };

  return benefits[tier];
}

/**
 * UpgradePrompt Component
 */
export function UpgradePrompt({
  open,
  onClose,
  currentTier,
  feature,
  customMessage,
  onUpgrade,
}: UpgradePromptProps) {
  // Get feature access information
  const accessResult = checkFeatureAccess(currentTier, feature);

  if (accessResult.allowed) {
    // User already has access, shouldn't show this
    return null;
  }

  const requiredTier = accessResult.requiredTier!;
  const requiredTierName = getTierName(requiredTier);
  const requiredPrice = getTierPrice(requiredTier);
  const featureDescription = getFeatureDescription(feature);
  const benefits = getTierBenefits(requiredTier);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()} modal>
      <DialogContent className="sm:max-w-[500px]" aria-modal="true">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="ml-auto">
              {requiredTierName} Feature
            </Badge>
          </div>
          <DialogTitle className="text-2xl">Unlock {featureDescription}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {customMessage || accessResult.reason}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pricing */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">${requiredPrice}</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{requiredTierName} Plan</p>
          </div>

          {/* Benefits */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              What you'll get:
            </h4>
            <ul className="space-y-2">
              {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade suggestion */}
          {accessResult.upgradeSuggestion && (
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
              <p className="text-sm text-muted-foreground">{accessResult.upgradeSuggestion}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          {onUpgrade ? (
            <Button onClick={onUpgrade} className="w-full sm:w-auto">
              Upgrade to {requiredTierName}
            </Button>
          ) : (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/pricing">Upgrade to {requiredTierName}</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

/**
 * PaywallModal Component
 * Feature: PAYWALL-002 - Comprehensive paywall modal with plan comparison
 *
 * Displays upgrade options when user hits a feature limit
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getTierLimits, getTierName, getTierPrice, type SubscriptionTier } from '@/lib/subscription/tier-limits';
import { cn } from '@/lib/utils';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: SubscriptionTier;
  heading?: string;
  description?: string;
  recommendedPlan?: SubscriptionTier;
}

const PLAN_ORDER: SubscriptionTier[] = ['starter', 'builder', 'agency', 'studio'];

interface PlanFeature {
  label: string;
  key: keyof ReturnType<typeof getTierLimits>;
  format?: (value: any) => string;
}

const PLAN_FEATURES: PlanFeature[] = [
  { label: 'PDF export', key: 'pdfExport' },
  { label: 'CSV export', key: 'csvExport' },
  { label: 'JSON export', key: 'jsonExport' },
  { label: 'Share reports', key: 'shareReports' },
  { label: 'API access', key: 'apiAccess' },
  { label: 'White-label', key: 'whiteLabel' },
  { label: 'Demand alerts', key: 'demandAlerts' },
  { label: 'Competitor alerts', key: 'competitorAlerts' },
  { label: 'Trend alerts', key: 'trendAlerts' },
];

export function PaywallModal({
  open,
  onClose,
  currentPlan,
  heading = 'Upgrade to unlock more features',
  description,
  recommendedPlan,
}: PaywallModalProps) {
  const router = useRouter();

  const handleUpgrade = (plan: SubscriptionTier) => {
    router.push(`/checkout/subscription?plan=${plan}`);
  };

  const renderFeatureValue = (plan: SubscriptionTier, feature: PlanFeature) => {
    const limits = getTierLimits(plan);
    const value = limits[feature.key];

    if (typeof value === 'boolean') {
      return value ? (
        <CheckIcon className="h-4 w-4 text-green-600" data-testid="feature-check" />
      ) : (
        <XIcon className="h-4 w-4 text-gray-300" />
      );
    }

    if (typeof value === 'number') {
      const formatted = feature.format ? feature.format(value) : value;
      return <span className="text-sm">{formatted}</span>;
    }

    return <span className="text-sm">{value}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Allow closing by clicking overlay
          const overlay = (e.target as HTMLElement).closest('[data-slot="dialog-overlay"]');
          if (overlay) {
            onClose();
          }
        }}
        aria-labelledby="paywall-modal-title"
        aria-modal="true"
      >
        {/* Close button overlay for testing */}
        <div
          data-testid="modal-overlay"
          className="fixed inset-0 -z-10"
          onClick={onClose}
          aria-hidden="true"
        />

        <DialogHeader>
          <DialogTitle id="paywall-modal-title">{heading}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
          {PLAN_ORDER.map((plan) => {
            const limits = getTierLimits(plan);
            const price = getTierPrice(plan);
            const isCurrentPlan = plan === currentPlan;
            const isRecommended = plan === recommendedPlan;

            return (
              <Card
                key={plan}
                data-plan={plan}
                data-testid="plan-card"
                className={cn(
                  'relative p-6 flex flex-col',
                  isCurrentPlan && 'current-plan ring-2 ring-primary',
                  isRecommended && 'recommended ring-2 ring-blue-500'
                )}
              >
                {isRecommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500">
                    Recommended
                  </Badge>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{getTierName(plan)}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${price}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                </div>

                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">{limits.analysisRuns} runs</span> per month
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Track up to <span className="font-semibold">{limits.niches} niches</span>
                  </p>
                </div>

                <div className="space-y-2 mb-6 flex-grow">
                  {PLAN_FEATURES.map((feature) => (
                    <div
                      key={feature.key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{feature.label}</span>
                      {renderFeatureValue(plan, feature)}
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrentPlan}
                  variant={isRecommended ? 'default' : 'outline'}
                  className="w-full"
                  aria-label={isCurrentPlan ? 'Current plan' : `Upgrade to ${getTierName(plan)}`}
                >
                  {isCurrentPlan ? 'Current Plan' : `Upgrade to ${getTierName(plan)}`}
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label="Close modal"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

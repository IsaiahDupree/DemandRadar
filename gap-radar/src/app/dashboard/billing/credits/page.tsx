"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { CREDIT_PACKAGES, CreditPackageKey } from "@/lib/stripe";

function SearchParamsHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success('Credits purchased successfully!');
      router.replace('/dashboard/billing/credits');
    } else if (canceled === 'true') {
      toast.error('Purchase canceled');
      router.replace('/dashboard/billing/credits');
    }
  }, [searchParams, router]);

  return null;
}

export default function CreditPurchasePage() {
  const [loading, setLoading] = useState<CreditPackageKey | null>(null);

  async function handlePurchase(packageKey: CreditPackageKey) {
    setLoading(packageKey);

    try {
      const response = await fetch('/api/checkout/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: packageKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initiate checkout');
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl" data-testid="credit-purchase-page">
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchase Credits</h1>
        <p className="text-muted-foreground">
          Buy one-time credits for additional market analyses
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6" data-testid="credit-packages">
        {/* Light Run */}
        <Card data-testid="package-light" data-price={CREDIT_PACKAGES.light.price} data-credits={CREDIT_PACKAGES.light.credits}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {CREDIT_PACKAGES.light.name}
              <Badge variant="secondary">1 Credit</Badge>
            </CardTitle>
            <CardDescription>{CREDIT_PACKAGES.light.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">${CREDIT_PACKAGES.light.price}</div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Fewer ads/mentions
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                1-3 gaps + quick MVP
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Platform recommendation
              </li>
            </ul>

            <Button
              className="w-full"
              onClick={() => handlePurchase('light')}
              disabled={loading !== null}
              data-testid="buy-light"
            >
              {loading === 'light' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Buy Light Run'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Full Dossier */}
        <Card
          data-testid="package-full"
          data-price={CREDIT_PACKAGES.full.price}
          data-credits={CREDIT_PACKAGES.full.credits}
          className="border-primary shadow-lg"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {CREDIT_PACKAGES.full.name}
                <Badge variant="secondary">3 Credits</Badge>
              </CardTitle>
              <Badge className="bg-primary">Popular</Badge>
            </div>
            <CardDescription>{CREDIT_PACKAGES.full.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">${CREDIT_PACKAGES.full.price}</div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Full data sources
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                3 ad test concepts
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                MVP spec
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                TAM/CAC model
              </li>
            </ul>

            <Button
              className="w-full"
              onClick={() => handlePurchase('full')}
              disabled={loading !== null}
              data-testid="buy-full"
            >
              {loading === 'full' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Buy Full Dossier
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Agency-ready */}
        <Card data-testid="package-agency" data-price={CREDIT_PACKAGES.agency.price} data-credits={CREDIT_PACKAGES.agency.credits}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {CREDIT_PACKAGES.agency.name}
              <Badge variant="secondary">10 Credits</Badge>
            </CardTitle>
            <CardDescription>{CREDIT_PACKAGES.agency.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">${CREDIT_PACKAGES.agency.price}</div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Everything in Full Dossier
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Landing page structure
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                10 ad angles
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Objection handling
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                Product backlog
              </li>
            </ul>

            <Button
              className="w-full"
              onClick={() => handlePurchase('agency')}
              disabled={loading !== null}
              data-testid="buy-agency"
            >
              {loading === 'agency' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Buy Agency Pack'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How Credits Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Credits are one-time purchases that never expire</p>
          <p>• Use credits to run market analyses anytime</p>
          <p>• Each analysis costs 1 credit (Light), 3 credits (Full), or 10 credits (Agency)</p>
          <p>• Credits stack with your monthly subscription allowance</p>
        </CardContent>
      </Card>
    </div>
  );
}

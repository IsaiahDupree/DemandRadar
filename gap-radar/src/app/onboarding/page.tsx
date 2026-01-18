"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { OfferingInput } from "./components/OfferingInput";
import { NichePreview } from "./components/NichePreview";

interface NicheConfig {
  offeringName: string;
  category: string;
  nicheTags: string[];
  customerProfile: {
    type: "B2C" | "B2B";
    segment: string;
    pricePoint: "low" | "mid" | "high";
  };
  competitors: string[];
  keywords: string[];
  geo: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [offeringText, setOfferingText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nicheConfig, setNicheConfig] = useState<NicheConfig | null>(null);

  const totalSteps = 3;
  const progress = ((step - 1) / totalSteps) * 100;

  // Step 1: Extract niche data from user's offering description
  const handleExtractNiche = async () => {
    if (!offeringText.trim()) {
      toast.error("Please describe what you offer");
      return;
    }

    setIsExtracting(true);

    try {
      const response = await fetch("/api/niches/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offering: offeringText }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract niche data");
      }

      const extracted = await response.json();
      setNicheConfig(extracted);
      setStep(2);
      toast.success("Niche data extracted successfully!");
    } catch (error) {
      console.error("Extract error:", error);
      toast.error("Failed to extract niche data. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Step 2: Preview and edit
  const handleContinueToConfirm = () => {
    if (!nicheConfig) return;
    setStep(3);
  };

  // Step 3: Create niche and start monitoring
  const handleCreateNiche = async () => {
    if (!nicheConfig) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/niches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nicheConfig),
      });

      if (!response.ok) {
        throw new Error("Failed to create niche");
      }

      const created = await response.json();
      toast.success("Niche tracking started! You'll receive your first Demand Brief next week.");

      // Redirect to niches dashboard
      router.push(`/dashboard/niches/${created.id}`);
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Failed to create niche. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    // Skip onboarding and redirect to dashboard
    toast.info("You can start onboarding anytime from your dashboard");
    router.push("/dashboard/new-run");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Demand Brief Setup
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Track Demand for Your Offering
          </h1>
          <p className="text-lg text-muted-foreground">
            Tell us what you sell, and we'll monitor market demand signals weekly
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Step 1: Offering Input */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Offering</CardTitle>
              <CardDescription>
                Tell us what you sell in a few words. Our AI will extract relevant niche data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <OfferingInput
                value={offeringText}
                onChange={setOfferingText}
                onSubmit={handleExtractNiche}
              />

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                >
                  Skip for now
                </Button>
                <Button
                  onClick={handleExtractNiche}
                  disabled={!offeringText.trim() || isExtracting}
                  size="lg"
                >
                  {isExtracting ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preview & Edit */}
        {step === 2 && nicheConfig && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Edit Your Niche</CardTitle>
              <CardDescription>
                We've extracted these details. Edit anything that doesn't look right.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <NichePreview
                config={nicheConfig}
                onChange={setNicheConfig}
              />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleContinueToConfirm}
                  size="lg"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && nicheConfig && (
          <Card>
            <CardHeader>
              <CardTitle>Start Tracking Demand</CardTitle>
              <CardDescription>
                We'll monitor these signals weekly and send you a Demand Brief email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h3 className="font-semibold mb-2">What we'll track:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        <strong>Keywords:</strong>{" "}
                        {nicheConfig.keywords.join(", ")}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        <strong>Competitors:</strong>{" "}
                        {nicheConfig.competitors.join(", ")}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        <strong>Sources:</strong> Meta Ads, Google Ads, Reddit, TikTok, App Stores
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border bg-primary/5 p-4">
                  <h3 className="font-semibold mb-2">You'll receive:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>✓ Weekly Demand Score (0-100) + trend</li>
                    <li>✓ What changed in your niche this week</li>
                    <li>✓ 3 actionable plays to test</li>
                    <li>✓ Copy-paste ad hooks and subject lines</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleCreateNiche}
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Start Tracking
                      <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground">
          Need help? Email support@demandradar.io
        </p>
      </div>
    </div>
  );
}

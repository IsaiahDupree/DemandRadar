"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles, Lightbulb } from "lucide-react";
import { completeOnboardingStep } from "@/lib/onboarding";

const EXAMPLE_QUERIES = [
  {
    id: 'ex1',
    query: 'AI tools for content creators',
    category: 'SaaS',
  },
  {
    id: 'ex2',
    query: 'Fitness apps for busy professionals',
    category: 'Mobile App',
  },
  {
    id: 'ex3',
    query: 'Project management tools for remote teams',
    category: 'SaaS',
  },
  {
    id: 'ex4',
    query: 'Meal planning apps for families',
    category: 'Mobile App',
  },
];

interface FirstRunWizardProps {
  onComplete?: (result: { completed: boolean; query?: string }) => void;
  onSkip?: () => void;
  markComplete?: boolean;
}

export function FirstRunWizard({ onComplete, onSkip, markComplete = true }: FirstRunWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");

  const totalSteps = 3;
  const progress = ((step - 1) / (totalSteps - 1)) * 100;

  const handleSelectExample = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      router.push("/dashboard/new-run");
    }
  };

  const handleComplete = () => {
    if (markComplete) {
      completeOnboardingStep('create_first_run');
    }

    if (onComplete) {
      onComplete({ completed: true, query });
    } else {
      // Navigate to new run page with query
      const params = query ? `?q=${encodeURIComponent(query)}` : '';
      router.push(`/dashboard/new-run${params}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" role="progressbar" />
      </div>

      {/* Step 1: Welcome */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Your First Analysis Run</CardTitle>
            <CardDescription>
              Let's find market gaps in your niche. We'll analyze ads, Reddit discussions, and app stores to find opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                What you'll get:
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Market gaps ranked by opportunity score</li>
                <li>• What's working in paid ads</li>
                <li>• What customers complain about on Reddit</li>
                <li>• Platform recommendations (web vs mobile)</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
              <Button onClick={handleNext} size="lg">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Choose a Niche */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a Niche to Analyze</CardTitle>
            <CardDescription>
              Enter a niche, product category, or competitor name. Or try one of our examples.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="niche-input" className="text-sm font-medium">
                What niche do you want to analyze?
              </label>
              <Input
                id="niche-input"
                type="text"
                placeholder="e.g., AI tools for content creators"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Examples:</p>
              <div className="grid grid-cols-1 gap-2">
                {EXAMPLE_QUERIES.map((example) => (
                  <Button
                    key={example.id}
                    variant="outline"
                    className="justify-start text-left h-auto py-3"
                    onClick={() => handleSelectExample(example.query)}
                    data-testid="example-query"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{example.query}</span>
                      <span className="text-xs text-muted-foreground">{example.category}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleNext} size="lg" disabled={!query.trim()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Ready to Start */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Start Your Analysis</CardTitle>
            <CardDescription>
              We'll analyze the "{query}" niche and generate a comprehensive report.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-primary/5 p-4">
              <h4 className="font-semibold mb-2">We'll analyze:</h4>
              <ul className="space-y-1 text-sm">
                <li>✓ Meta ads from the past 90 days</li>
                <li>✓ Reddit discussions and pain points</li>
                <li>✓ iOS and Android app stores</li>
                <li>✓ Top competitors and their angles</li>
              </ul>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4">
              <p className="text-sm text-yellow-900 dark:text-yellow-200">
                <strong>Note:</strong> Analysis takes 5-10 minutes. You can leave this page and we'll notify you when it's ready.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleComplete} size="lg">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skip hint */}
      <p className="text-center text-sm text-muted-foreground">
        You can skip this wizard anytime and start from the dashboard
      </p>
    </div>
  );
}

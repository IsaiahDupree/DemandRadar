"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X, Circle } from "lucide-react";
import { OnboardingStep, getOnboardingProgress } from "@/lib/onboarding";

interface ChecklistProps {
  steps: OnboardingStep[];
  onStepComplete: (stepId: string) => void;
  onDismiss: () => void;
  dismissed?: boolean;
}

export function Checklist({ steps, onStepComplete, onDismiss, dismissed = false }: ChecklistProps) {
  if (dismissed) {
    return null;
  }

  const progress = getOnboardingProgress(steps);
  const allCompleted = steps.every(step => step.completed);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Getting Started</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            data-testid="dismiss-checklist"
            aria-label="Dismiss checklist"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        {allCompleted ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">All set!</h3>
            <p className="text-sm text-muted-foreground">
              You have completed the onboarding checklist
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {steps.map((step) => (
              <li
                key={step.id}
                data-testid="checklist-item"
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {step.completed ? (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center checklist-item-completed">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
                {!step.completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStepComplete(step.id)}
                    data-testid="complete-step-button"
                    className="flex-shrink-0 text-xs"
                  >
                    Mark done
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

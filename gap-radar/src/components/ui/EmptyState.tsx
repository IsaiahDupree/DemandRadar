import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CTAConfig {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  headline: string;
  description: string;
  illustration?: React.ReactNode;
  icon?: React.ComponentType;
  primaryCTA?: CTAConfig;
  secondaryCTA?: CTAConfig;
  className?: string;
}

export function EmptyState({
  headline,
  description,
  illustration,
  icon: Icon,
  primaryCTA,
  secondaryCTA,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className={cn(
        "flex flex-col items-center justify-center text-center gap-6 py-12 px-4",
        className
      )}
    >
      {/* Illustration/Icon Slot */}
      {illustration && <div className="mb-2">{illustration}</div>}
      {Icon && !illustration && (
        <div className="mb-2">
          <Icon />
        </div>
      )}

      {/* Text Content */}
      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-semibold tracking-tight">{headline}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {/* CTAs */}
      {(primaryCTA || secondaryCTA) && (
        <div className="flex gap-3 mt-2">
          {primaryCTA && (
            <Button onClick={primaryCTA.onClick}>{primaryCTA.label}</Button>
          )}
          {secondaryCTA && (
            <Button variant="outline" onClick={secondaryCTA.onClick}>
              {secondaryCTA.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

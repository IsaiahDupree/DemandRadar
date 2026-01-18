/**
 * User Pain Map Report Section
 *
 * Report Page 3: Displays top objections, desired features, pricing friction,
 * trust issues, and switching triggers from Reddit and user sentiment data.
 *
 * @see PRD §8 - Report Structure (User Pain Map)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Heart, DollarSign, Shield, ArrowRightLeft, MessageSquare } from 'lucide-react';

export interface ObjectionExample {
  id: string;
  snippet: string;
  source: string;
  score: number;
}

export interface TopObjection {
  id: string;
  label: string;
  frequency: number;
  intensity: number;
  sentiment: number;
  examples: ObjectionExample[];
}

export interface DesiredFeature {
  id: string;
  label: string;
  frequency: number;
  intensity: number;
  examples: ObjectionExample[];
}

export interface PricingFrictionQuote {
  id: string;
  text: string;
  source: string;
  score: number;
}

export interface PricingFriction {
  id: string;
  issue: string;
  frequency: number;
  quotes: PricingFrictionQuote[];
}

export interface TrustIssue {
  id: string;
  issue: string;
  frequency: number;
  quotes: PricingFrictionQuote[];
}

export interface SwitchingTrigger {
  id: string;
  trigger: string;
  frequency: number;
  context: string;
}

export interface UserPainMapProps {
  topObjections: TopObjection[];
  desiredFeatures: DesiredFeature[];
  pricingFriction: PricingFriction[];
  trustIssues: TrustIssue[];
  switchingTriggers: SwitchingTrigger[];
}

/**
 * Get intensity badge color based on intensity score
 */
function getIntensityColor(intensity: number): string {
  if (intensity >= 0.7) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
  if (intensity >= 0.5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
}

/**
 * Get frequency badge color
 */
function getFrequencyColor(frequency: number): string {
  if (frequency >= 40) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
  if (frequency >= 20) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

export function UserPainMap({
  topObjections,
  desiredFeatures,
  pricingFriction,
  trustIssues,
  switchingTriggers,
}: UserPainMapProps) {
  // Limit display counts
  const displayObjections = topObjections.slice(0, 10);
  const displayFeatures = desiredFeatures.slice(0, 10);
  const displayPricing = pricingFriction.slice(0, 8);
  const displayTrust = trustIssues.slice(0, 6);
  const displayTriggers = switchingTriggers.slice(0, 5);

  return (
    <div className="space-y-6" data-testid="user-pain-map">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          User Pain Map
        </h2>
        <p className="text-muted-foreground">
          What customers actually say - top objections, desired features, and friction points
        </p>
      </div>

      {/* Top Objections */}
      <Card data-testid="objections-section">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Top Objections
          </CardTitle>
          <CardDescription>
            The most frequent and intense complaints ranked by impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayObjections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No objections identified yet
            </p>
          ) : (
            <div className="space-y-4">
              {displayObjections.map((objection, index) => (
                <div
                  key={objection.id}
                  className="p-4 rounded-lg border"
                  data-testid={`objection-${index}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold">{objection.label}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={getFrequencyColor(objection.frequency)}
                        data-testid={`objection-${index}-frequency`}
                      >
                        {objection.frequency} mentions
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getIntensityColor(objection.intensity)}
                        data-testid={`objection-${index}-intensity`}
                      >
                        {Math.round(objection.intensity * 100)}% intensity
                      </Badge>
                    </div>
                  </div>

                  {/* Examples */}
                  {objection.examples.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {objection.examples.slice(0, 3).map((example) => (
                        <div
                          key={example.id}
                          className="text-sm bg-muted/50 p-3 rounded"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium text-xs text-muted-foreground">
                              {example.source}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              ↑ {example.score}
                            </Badge>
                          </div>
                          <p className="text-foreground">{example.snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desired Features */}
      <Card data-testid="features-section">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Desired Features
          </CardTitle>
          <CardDescription>
            The most requested features and improvements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayFeatures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No feature requests identified yet
            </p>
          ) : (
            <div className="space-y-4">
              {displayFeatures.map((feature, index) => (
                <div
                  key={feature.id}
                  className="p-4 rounded-lg border"
                  data-testid={`feature-${index}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold">{feature.label}</h4>
                    </div>
                    <Badge
                      variant="outline"
                      className={getFrequencyColor(feature.frequency)}
                      data-testid={`feature-${index}-frequency`}
                    >
                      {feature.frequency} mentions
                    </Badge>
                  </div>

                  {/* Examples */}
                  {feature.examples.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {feature.examples.slice(0, 2).map((example) => (
                        <div
                          key={example.id}
                          className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded"
                        >
                          <p className="font-medium text-xs text-muted-foreground mb-1">
                            {example.source}
                          </p>
                          <p className="text-foreground">{example.snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Friction */}
      <Card data-testid="pricing-friction-section">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Friction
          </CardTitle>
          <CardDescription>
            Common pricing objections and payment concerns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayPricing.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pricing friction identified yet
            </p>
          ) : (
            <div className="space-y-4">
              {displayPricing.map((friction, index) => (
                <div
                  key={friction.id}
                  className="p-4 rounded-lg border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                      {friction.issue}
                    </h4>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                      {friction.frequency} mentions
                    </Badge>
                  </div>

                  {/* Quotes */}
                  {friction.quotes.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {friction.quotes.slice(0, 2).map((quote) => (
                        <div
                          key={quote.id}
                          className="text-sm bg-orange-50 dark:bg-orange-900/20 p-3 rounded border-l-2 border-orange-400"
                        >
                          <p className="font-medium text-xs text-muted-foreground mb-1">
                            {quote.source}
                          </p>
                          <p className="text-foreground italic">"{quote.text}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trust Issues */}
      <Card data-testid="trust-issues-section">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust Issues
          </CardTitle>
          <CardDescription>
            Security, privacy, and reliability concerns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayTrust.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No trust issues identified yet
            </p>
          ) : (
            <div className="space-y-4">
              {displayTrust.map((issue) => (
                <div
                  key={issue.id}
                  className="p-4 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                      {issue.issue}
                    </h4>
                    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                      {issue.frequency} mentions
                    </Badge>
                  </div>

                  {/* Quotes */}
                  {issue.quotes.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {issue.quotes.slice(0, 2).map((quote) => (
                        <div
                          key={quote.id}
                          className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded border-l-2 border-red-400"
                        >
                          <p className="font-medium text-xs text-muted-foreground mb-1">
                            {quote.source}
                          </p>
                          <p className="text-foreground italic">"{quote.text}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Switching Triggers */}
      <Card data-testid="switching-triggers-section">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Switching Triggers
          </CardTitle>
          <CardDescription>
            Common reasons users switch away from existing solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayTriggers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No switching triggers identified yet
            </p>
          ) : (
            <div className="space-y-3">
              {displayTriggers.map((trigger, index) => (
                <div
                  key={trigger.id}
                  className="p-4 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                        {trigger.trigger}
                      </h4>
                    </div>
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                      {trigger.frequency} cases
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground ml-9">
                    {trigger.context}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuildRecommendation } from '@/types';
import {
  TrendingUp,
  Target,
  Users,
  Wrench,
  MessageSquare,
  Search,
  Lightbulb,
  Download,
  Rocket,
  Bookmark
} from 'lucide-react';

interface RecommendationDetailProps {
  recommendation: BuildRecommendation;
  isOpen: boolean;
  onClose: () => void;
  onExport?: (recommendation: BuildRecommendation) => void;
  onStartBuilding?: (recommendation: BuildRecommendation) => void;
  onSaveToQueue?: (recommendation: BuildRecommendation) => void;
}

function getComplexityBadge(complexity: string | null) {
  if (!complexity) return null;

  const colors = {
    weekend: 'bg-green-100 text-green-800 border-green-200',
    month: 'bg-blue-100 text-blue-800 border-blue-200',
    quarter: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return colors[complexity as keyof typeof colors] || colors.month;
}

function getConfidenceColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-orange-600';
}

export function RecommendationDetail({
  recommendation,
  isOpen,
  onClose,
  onExport,
  onStartBuilding,
  onSaveToQueue
}: RecommendationDetailProps) {
  const confidenceColor = getConfidenceColor(recommendation.confidenceScore);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {recommendation.productType && (
                  <Badge variant="outline" className="capitalize">
                    {recommendation.productType.replace('_', ' ')}
                  </Badge>
                )}
                {recommendation.buildComplexity && (
                  <Badge
                    variant="outline"
                    className={getComplexityBadge(recommendation.buildComplexity)}
                  >
                    {recommendation.buildComplexity}
                  </Badge>
                )}
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <span className={`text-sm font-semibold ${confidenceColor}`}>
                    {recommendation.confidenceScore}%
                  </span>
                </div>
              </div>
              <DialogTitle className="text-2xl">{recommendation.productIdea}</DialogTitle>
              {recommendation.oneLiner && (
                <p className="text-muted-foreground italic">&ldquo;{recommendation.oneLiner}&rdquo;</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Target Audience */}
          {recommendation.targetAudience && (
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Target Audience
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {recommendation.targetAudience}
              </p>
            </div>
          )}

          {/* Why Now */}
          {(recommendation.reasoning || recommendation.supportingSignals > 0) && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Why Now
              </h3>
              {recommendation.reasoning && (
                <p className="leading-relaxed mb-2">{recommendation.reasoning}</p>
              )}
              {recommendation.supportingSignals > 0 && (
                <p className="text-sm text-muted-foreground">
                  Based on {recommendation.supportingSignals} supporting signals
                </p>
              )}
            </div>
          )}

          {/* Pain Points */}
          {recommendation.painPoints && recommendation.painPoints.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Pain Points from Users
              </h3>
              <div className="space-y-2">
                {recommendation.painPoints.map((point, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">&ldquo;{point.text}&rdquo;</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Source: {point.source}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitor Gaps */}
          {recommendation.competitorGaps && recommendation.competitorGaps.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Competitor Gaps
              </h3>
              <div className="space-y-2">
                {recommendation.competitorGaps.map((gap, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{gap.competitor}</p>
                      <p className="text-sm text-muted-foreground">{gap.gap}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Queries */}
          {recommendation.searchQueries && recommendation.searchQueries.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Search className="h-5 w-5" />
                High-Intent Search Queries
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {recommendation.searchQueries.map((query, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">&ldquo;{query.query}&rdquo;</span>
                    <Badge variant="secondary" className="text-xs">
                      {query.volume.toLocaleString()}/mo
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Build Estimate */}
          {(recommendation.buildComplexity || recommendation.estimatedTimeToMvp || recommendation.techStackSuggestion) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Build Estimate
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendation.buildComplexity && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Complexity</p>
                    <p className="font-medium capitalize">{recommendation.buildComplexity} Project</p>
                  </div>
                )}
                {recommendation.estimatedTimeToMvp && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Time to MVP</p>
                    <p className="font-medium">{recommendation.estimatedTimeToMvp}</p>
                  </div>
                )}
                {recommendation.estimatedCacRange && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Est. CAC Range</p>
                    <p className="font-medium">{recommendation.estimatedCacRange}</p>
                  </div>
                )}
              </div>
              {recommendation.techStackSuggestion && recommendation.techStackSuggestion.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-2">Suggested Tech Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.techStackSuggestion.map((tech, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommended Hooks */}
          {recommendation.recommendedHooks && recommendation.recommendedHooks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Recommended Hooks</h3>
              <div className="space-y-2">
                {recommendation.recommendedHooks.map((hook, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground">{idx + 1}.</span>
                    <p className="text-sm flex-1">&ldquo;{hook}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample Ad Copy */}
          {recommendation.sampleAdCopy && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Sample Ad Copy</h3>
              <div className="border-2 border-primary/20 rounded-lg p-4 space-y-3 bg-background">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Headline</p>
                  <p className="font-semibold text-lg">{recommendation.sampleAdCopy.headline}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Body</p>
                  <p className="text-sm leading-relaxed">{recommendation.sampleAdCopy.body}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">CTA</p>
                  <p className="font-medium text-primary">{recommendation.sampleAdCopy.cta}</p>
                </div>
              </div>
            </div>
          )}

          {/* Best Channels */}
          {recommendation.recommendedChannels && recommendation.recommendedChannels.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Best Channels</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {recommendation.recommendedChannels.map((channel, idx) => (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="font-medium text-sm">{channel}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
          <Button
            variant="default"
            onClick={() => onStartBuilding?.(recommendation)}
            className="gap-2"
          >
            <Rocket className="h-4 w-4" />
            Start Building
          </Button>
          <Button
            variant="outline"
            onClick={() => onSaveToQueue?.(recommendation)}
            className="gap-2"
          >
            <Bookmark className="h-4 w-4" />
            Save to Queue
          </Button>
          <Button
            variant="outline"
            onClick={() => onExport?.(recommendation)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Brief
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

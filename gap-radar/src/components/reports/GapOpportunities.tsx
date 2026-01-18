/**
 * Gap Opportunities Ranked Section
 *
 * Report Page 5: Displays ranked gap opportunities with evidence,
 * recommendations, and expected impact.
 *
 * @see PRD §8 - Report Structure (Gap Opportunities)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Megaphone, MessageCircle } from 'lucide-react';
import type { GapOpportunity } from '@/types';

export interface GapOpportunitiesProps {
  gaps: GapOpportunity[];
}

/**
 * Get gap type display name
 */
function getGapTypeLabel(gapType: string): string {
  const labels: Record<string, string> = {
    product: 'Product',
    offer: 'Offer',
    positioning: 'Positioning',
    trust: 'Trust',
    pricing: 'Pricing',
  };
  return labels[gapType] || gapType;
}

/**
 * Get gap type badge color
 */
function getGapTypeBadge(gapType: string): string {
  const colors: Record<string, string> = {
    product: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    offer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    positioning: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    trust: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    pricing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  };
  return colors[gapType] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
}

/**
 * Get impact level from opportunity score
 */
function getImpactLevel(score: number): string {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

/**
 * Get impact level color
 */
function getImpactColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
}

/**
 * Get score badge color
 */
function getScoreBadge(score: number): string {
  if (score >= 80) return 'bg-green-600 text-white';
  if (score >= 60) return 'bg-yellow-600 text-white';
  return 'bg-gray-600 text-white';
}

/**
 * Render individual gap card
 */
function GapCard({ gap, index }: { gap: GapOpportunity; index: number }) {
  // Limit evidence display
  const displayAds = gap.evidenceAds.slice(0, 2);
  const displayReddit = gap.evidenceReddit.slice(0, 3);

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`gap-${index}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getGapTypeBadge(gap.gapType)} data-testid={`gap-${index}-type`}>
              {getGapTypeLabel(gap.gapType)}
            </Badge>
            <Badge className={getImpactColor(gap.opportunityScore)} data-testid={`gap-${index}-impact`}>
              {getImpactLevel(gap.opportunityScore)} Impact
            </Badge>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={getScoreBadge(gap.opportunityScore)} data-testid={`gap-${index}-score`}>
              {gap.opportunityScore}
            </Badge>
            <span className="text-xs text-muted-foreground" data-testid={`gap-${index}-confidence`}>
              {Math.round(gap.confidence * 100)}%
            </span>
          </div>
        </div>
        <CardTitle className="text-xl">{gap.title}</CardTitle>
        <CardDescription className="text-sm">{gap.problem}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Evidence from Ads */}
        {displayAds.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Evidence from Ads
            </h4>
            <div className="space-y-2">
              {displayAds.map((evidence, evidenceIndex) => (
                <div
                  key={evidence.id}
                  className="text-xs bg-blue-50 dark:bg-blue-950/20 p-2 rounded border-l-2 border-blue-500"
                  data-testid={`gap-${index}-ad-${evidenceIndex}`}
                >
                  "{evidence.snippet}"
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence from Reddit */}
        {displayReddit.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Evidence from Reddit
            </h4>
            <div className="space-y-2">
              {displayReddit.map((evidence, evidenceIndex) => (
                <div
                  key={evidence.id}
                  className="text-xs bg-orange-50 dark:bg-orange-950/20 p-2 rounded border-l-2 border-orange-500"
                  data-testid={`gap-${index}-reddit-${evidenceIndex}`}
                >
                  "{evidence.snippet}"
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3% Better Recommendation */}
        <div className="pt-3 border-t">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
            <TrendingUp className="h-4 w-4" />
            3% Better Recommendation
          </h4>
          <p className="text-sm bg-green-50 dark:bg-green-950/20 p-3 rounded border-l-2 border-green-500">
            {gap.recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function GapOpportunities({ gaps }: GapOpportunitiesProps) {
  // Sort gaps by opportunity score (highest first)
  const sortedGaps = [...gaps].sort((a, b) => b.opportunityScore - a.opportunityScore);

  return (
    <div className="space-y-6" data-testid="gap-opportunities">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          Gap Opportunities (Ranked)
        </h2>
        <p className="text-muted-foreground">
          Market gaps ranked by opportunity score - with evidence, recommendations, and expected impact
        </p>
      </div>

      {/* Gap Cards */}
      {sortedGaps.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No gap opportunities found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedGaps.map((gap, index) => (
            <GapCard key={gap.id} gap={gap} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

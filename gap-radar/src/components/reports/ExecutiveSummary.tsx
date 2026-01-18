/**
 * Executive Summary Report Section
 *
 * Report Page 1: Displays niche name, overall opportunity score, top 3 gaps,
 * and platform recommendation.
 *
 * @see PRD §8 - Report Structure (Executive Summary)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertCircle } from 'lucide-react';

export interface GapSummary {
  id: string;
  type: 'product' | 'offer' | 'positioning' | 'trust' | 'pricing';
  title: string;
  score: number;
  confidence: number;
}

export interface ExecutiveSummaryProps {
  nicheName: string;
  opportunityScore: number;
  confidence: number;
  topGaps: GapSummary[];
  platformRecommendation: {
    platform: 'web' | 'mobile' | 'hybrid';
    reasoning: string;
  };
  totalAds?: number;
  totalMentions?: number;
  uniqueAdvertisers?: number;
}

/**
 * Get color class based on score
 */
function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 dark:text-green-400';
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get score status icon
 */
function getScoreIcon(score: number) {
  if (score >= 70) return <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />;
  if (score >= 50) return <Minus className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
  return <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />;
}

/**
 * Get confidence badge variant
 */
function getConfidenceBadge(confidence: number) {
  if (confidence >= 0.8) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        High Confidence
      </Badge>
    );
  }
  if (confidence >= 0.5) {
    return (
      <Badge variant="secondary">
        Medium Confidence
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
      <AlertCircle className="h-3 w-3 mr-1" />
      Low Confidence
    </Badge>
  );
}

/**
 * Get gap type badge color
 */
function getGapTypeBadge(type: string) {
  const colorMap: Record<string, string> = {
    product: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    offer: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    positioning: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
    trust: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    pricing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  };

  return (
    <Badge variant="outline" className={colorMap[type] || ''}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

/**
 * Get platform icon/badge
 */
function getPlatformBadge(platform: string) {
  const platformMap: Record<string, string> = {
    web: '🌐 Web',
    mobile: '📱 Mobile',
    hybrid: '🔄 Hybrid',
  };

  return (
    <Badge variant="outline" className="text-base">
      {platformMap[platform] || platform}
    </Badge>
  );
}

export function ExecutiveSummary({
  nicheName,
  opportunityScore,
  confidence,
  topGaps,
  platformRecommendation,
  totalAds,
  totalMentions,
  uniqueAdvertisers,
}: ExecutiveSummaryProps) {
  // Limit to top 3 gaps
  const displayGaps = topGaps.slice(0, 3);

  return (
    <div className="space-y-6" data-testid="executive-summary">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" data-testid="niche-name">
          {nicheName}
        </h1>
        <p className="text-muted-foreground">
          Executive Summary · Market Gap Analysis
        </p>
      </div>

      {/* Opportunity Score Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Opportunity Score</CardTitle>
            {getConfidenceBadge(confidence)}
          </div>
          <CardDescription>
            Overall market gap opportunity based on ads, user sentiment, and market saturation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {getScoreIcon(opportunityScore)}
            <div className="flex-1">
              <div className="flex items-baseline space-x-2 mb-2">
                <span
                  className={`text-4xl font-bold ${getScoreColor(opportunityScore)}`}
                  data-testid="opportunity-score"
                >
                  {Math.round(opportunityScore)}
                </span>
                <span className="text-muted-foreground text-sm">/ 100</span>
              </div>
              <Progress
                value={opportunityScore}
                className="h-2"
                data-testid="opportunity-progress"
              />
            </div>
          </div>

          {/* Data Summary */}
          {(totalAds !== undefined || totalMentions !== undefined) && (
            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
              {totalAds !== undefined && (
                <div>
                  <p className="text-muted-foreground">Total Ads</p>
                  <p className="font-semibold" data-testid="total-ads">{totalAds}</p>
                </div>
              )}
              {uniqueAdvertisers !== undefined && (
                <div>
                  <p className="text-muted-foreground">Advertisers</p>
                  <p className="font-semibold" data-testid="unique-advertisers">{uniqueAdvertisers}</p>
                </div>
              )}
              {totalMentions !== undefined && (
                <div>
                  <p className="text-muted-foreground">Reddit Mentions</p>
                  <p className="font-semibold" data-testid="total-mentions">{totalMentions}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Gaps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Market Gaps</CardTitle>
          <CardDescription>
            The biggest opportunities identified in this niche
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayGaps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No gaps identified yet
            </p>
          ) : (
            <div className="space-y-4" data-testid="top-gaps-list">
              {displayGaps.map((gap, index) => (
                <div
                  key={gap.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border"
                  data-testid={`gap-item-${index}`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      {getGapTypeBadge(gap.type)}
                      <Badge
                        variant="outline"
                        className={getScoreColor(gap.score)}
                      >
                        {Math.round(gap.score)}
                      </Badge>
                    </div>
                    <p className="font-medium leading-tight">{gap.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Recommendation</CardTitle>
          <CardDescription>
            Recommended launch surface based on market analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Recommended Platform:</span>
              {getPlatformBadge(platformRecommendation.platform)}
            </div>
            <p className="text-sm" data-testid="platform-reasoning">
              {platformRecommendation.reasoning}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

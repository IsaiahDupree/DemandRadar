/**
 * Platform Existence Gap Report Section
 *
 * Report Page 4: Displays iOS/Android/Web saturation scores with top apps
 * and launch surface recommendation.
 *
 * @see PRD §8 - Report Structure (Platform Existence Gap)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Globe, Monitor, Star, TrendingUp } from 'lucide-react';
import type { PlatformPresence, AppStoreResult, AppPlatform } from '@/types';

export interface PlatformRecommendation {
  platform: AppPlatform;
  reasoning: string;
  confidence: number;
}

export interface PlatformGapProps {
  platforms: PlatformPresence[];
  recommendation: PlatformRecommendation;
}

/**
 * Get platform icon
 */
function getPlatformIcon(platform: AppPlatform) {
  switch (platform) {
    case 'ios':
      return <Smartphone className="h-5 w-5" />;
    case 'android':
      return <Smartphone className="h-5 w-5" />;
    case 'web':
      return <Globe className="h-5 w-5" />;
    default:
      return <Monitor className="h-5 w-5" />;
  }
}

/**
 * Get platform display name
 */
function getPlatformName(platform: AppPlatform): string {
  switch (platform) {
    case 'ios':
      return 'iOS';
    case 'android':
      return 'Android';
    case 'web':
      return 'Web';
    default:
      return platform;
  }
}

/**
 * Get saturation level label
 */
function getSaturationLevel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

/**
 * Get saturation level color
 */
function getSaturationColor(score: number): string {
  if (score >= 70) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
}

/**
 * Format number with thousands separator
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Render individual app card
 */
function AppCard({ app, index, platform }: { app: AppStoreResult; index: number; platform: AppPlatform }) {
  // Create unique index by combining platform and index
  const uniqueId = `${platform}-${index}`;

  return (
    <div className="p-3 rounded-lg border bg-card" data-testid={`app-${index}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h5 className="font-semibold text-sm flex-1">{app.appName}</h5>
        <div className="flex items-center gap-1 text-xs">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span data-testid={`app-${index}-rating`}>{app.rating.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{app.developer}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground" data-testid={`app-${index}-reviews`}>
          {formatNumber(app.reviewCount)} reviews
        </span>
        <Badge variant="outline" className="text-xs">
          {app.price}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Render platform section
 */
function PlatformSection({ platform, startIndex = 0 }: { platform: PlatformPresence; startIndex?: number }) {
  const displayApps = platform.topApps.slice(0, 5);
  const saturationLevel = getSaturationLevel(platform.saturationScore);
  const saturationColor = getSaturationColor(platform.saturationScore);

  return (
    <Card data-testid={`platform-${platform.platform}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {getPlatformIcon(platform.platform)}
          {getPlatformName(platform.platform)}
        </CardTitle>
        <CardDescription>
          {platform.count} {platform.count === 1 ? 'app' : 'apps'} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Saturation Score */}
        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Saturation Score</span>
            <Badge className={saturationColor} data-testid={`platform-${platform.platform}-level`}>
              {saturationLevel}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${platform.saturationScore}%` }}
              />
            </div>
            <span className="text-sm font-bold" data-testid={`platform-${platform.platform}-saturation`}>
              {platform.saturationScore}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <span data-testid={`platform-${platform.platform}-count`}>{platform.count}</span> competitors detected
          </p>
        </div>

        {/* Top Apps */}
        {displayApps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No apps found
          </p>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold mb-3">Top Apps</h4>
            {displayApps.map((app, localIndex) => (
              <AppCard
                key={app.id}
                app={app}
                index={startIndex + localIndex}
                platform={platform.platform}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PlatformGap({ platforms, recommendation }: PlatformGapProps) {
  // Sort platforms: recommended first, then by saturation (low to high)
  const sortedPlatforms = [...platforms].sort((a, b) => {
    if (a.platform === recommendation.platform) return -1;
    if (b.platform === recommendation.platform) return 1;
    return a.saturationScore - b.saturationScore;
  });

  // Create a global app index counter for unique test IDs
  let globalAppIndex = 0;

  return (
    <div className="space-y-6" data-testid="platform-gap">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Monitor className="h-6 w-6" />
          Platform Existence Gap
        </h2>
        <p className="text-muted-foreground">
          iOS, Android, and Web saturation analysis with launch surface recommendation
        </p>
      </div>

      {/* Platform Recommendation */}
      <Card
        className="border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
        data-testid="platform-recommendation"
      >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Recommended Launch Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getPlatformIcon(recommendation.platform)}
              <span className="text-2xl font-bold">
                {getPlatformName(recommendation.platform)}
              </span>
              <Badge className="ml-2 bg-blue-600 text-white" data-testid="recommendation-confidence">
                {Math.round(recommendation.confidence * 100)}% confidence
              </Badge>
            </div>
            <p className="text-sm leading-relaxed">{recommendation.reasoning}</p>
          </div>
        </CardContent>
      </Card>

      {/* Platform Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedPlatforms.map((platform) => {
          const startIndex = globalAppIndex;
          globalAppIndex += Math.min(platform.topApps.length, 5);
          return (
            <PlatformSection key={platform.platform} platform={platform} startIndex={startIndex} />
          );
        })}
      </div>
    </div>
  );
}

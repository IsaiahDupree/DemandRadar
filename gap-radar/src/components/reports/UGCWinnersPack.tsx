/**
 * UGC Winners Pack Report Section
 *
 * Report Page 8: Displays top UGC creatives, trend signals, creative patterns,
 * hooks, scripts, and shot list.
 *
 * @see PRD §8 - Report Structure (Page 8: UGC Winners Pack)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, Video, Clapperboard, Lightbulb, FileText } from 'lucide-react';

export interface UGCAssetDisplay {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  platform: 'tiktok' | 'instagram';
  source: string;
  score: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  patterns?: {
    hookType: string;
    format: string;
    proofType: string;
    objectionHandled?: string;
    ctaStyle: string;
  };
}

export interface TrendSignal {
  hashtag: string;
  count: number;
  growth: number;
}

export interface Hook {
  text: string;
  type: string;
}

export interface Script {
  duration: string;
  outline: string[];
}

export interface Shot {
  shot: string;
  notes: string;
}

export interface UGCWinnersPackProps {
  topUGCAssets: UGCAssetDisplay[];
  trendSignals: TrendSignal[];
  hooks: Hook[];
  scripts: Script[];
  shotList: Shot[];
}

/**
 * Format number with K/M suffix
 */
function formatCount(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

/**
 * Get platform badge
 */
function getPlatformBadge(platform: string) {
  const platformMap: Record<string, { icon: string; color: string }> = {
    tiktok: { icon: '🎵', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100' },
    instagram: { icon: '📷', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100' },
  };

  const config = platformMap[platform.toLowerCase()] || { icon: '📱', color: '' };

  return (
    <Badge variant="outline" className={config.color}>
      {config.icon} {platform === 'tiktok' ? 'TikTok' : 'Instagram'}
    </Badge>
  );
}

/**
 * Get score color class
 */
function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-gray-600 dark:text-gray-400';
}

export function UGCWinnersPack({
  topUGCAssets,
  trendSignals,
  hooks,
  scripts,
  shotList,
}: UGCWinnersPackProps) {
  return (
    <div className="space-y-6" data-testid="ugc-winners-pack">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          UGC Winners Pack
        </h1>
        <p className="text-muted-foreground">
          Top-performing UGC content, creative patterns, and production blueprints
        </p>
      </div>

      {/* Top UGC Assets */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <CardTitle className="text-lg">Top Ad-Tested UGC Creatives</CardTitle>
          </div>
          <CardDescription>
            Highest-performing UGC content based on longevity, reach, and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topUGCAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No UGC assets available
            </p>
          ) : (
            <div className="space-y-4" data-testid="ugc-assets-list">
              {topUGCAssets.map((asset, index) => (
                <div
                  key={asset.id}
                  className="p-4 rounded-lg border space-y-3"
                  data-testid={`ugc-asset-${index}`}
                >
                  {/* Header: Platform, Score, Link */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getPlatformBadge(asset.platform)}
                      <Badge variant="outline" className={getScoreColor(asset.score)}>
                        Score: {Math.round(asset.score)}
                      </Badge>
                    </div>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center space-x-1"
                    >
                      <span>View</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Thumbnail & Caption */}
                  <div className="flex space-x-3">
                    {asset.thumbnailUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={asset.thumbnailUrl}
                          alt="UGC thumbnail"
                          className="w-24 h-24 object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      {asset.caption && (
                        <p className="text-sm font-medium leading-tight">{asset.caption}</p>
                      )}

                      {/* Metrics */}
                      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                        <div>
                          <p className="font-semibold text-foreground">{formatCount(asset.views)}</p>
                          <p>views</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{formatCount(asset.likes)}</p>
                          <p>likes</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{formatCount(asset.comments)}</p>
                          <p>comments</p>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{formatCount(asset.shares)}</p>
                          <p>shares</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patterns */}
                  {asset.patterns && (
                    <div className="pt-3 border-t space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Creative Patterns</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {asset.patterns.hookType}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {asset.patterns.format}
                        </Badge>
                        {asset.patterns.objectionHandled && (
                          <Badge variant="secondary" className="text-xs">
                            Handles: {asset.patterns.objectionHandled}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend Signals */}
      {trendSignals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle className="text-lg">Trend Signals</CardTitle>
            </div>
            <CardDescription>
              Trending hashtags and topics relevant to this niche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {trendSignals.map((signal, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border space-y-1"
                >
                  <p className="font-semibold text-sm">{signal.hashtag}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCount(signal.count)} posts</span>
                    <Badge
                      variant="outline"
                      className="text-green-600 dark:text-green-400 text-xs"
                    >
                      +{signal.growth}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <CardTitle className="text-lg">10 Winning Hooks</CardTitle>
          </div>
          <CardDescription>
            Attention-grabbing openers based on top-performing patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="hooks-list">
            {hooks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hooks generated yet
              </p>
            ) : (
              hooks.map((hook, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border space-y-2"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm leading-tight">{hook.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{hook.type}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scripts */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <CardTitle className="text-lg">5 Script Blueprints</CardTitle>
          </div>
          <CardDescription>
            Proven video script structures for different durations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="scripts-list">
            {scripts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No scripts generated yet
              </p>
            ) : (
              scripts.map((script, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{script.duration}</Badge>
                    <p className="font-semibold text-sm">Script {index + 1}</p>
                  </div>
                  <ol className="space-y-2 pl-4">
                    {script.outline.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-sm text-muted-foreground">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shot List */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clapperboard className="h-5 w-5" />
            <CardTitle className="text-lg">Shot List</CardTitle>
          </div>
          <CardDescription>
            Camera shots and technical instructions for UGC production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="shot-list">
            {shotList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No shot list available
              </p>
            ) : (
              shotList.map((shot, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border space-y-1"
                >
                  <p className="font-medium text-sm">{shot.shot}</p>
                  <p className="text-xs text-muted-foreground">{shot.notes}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

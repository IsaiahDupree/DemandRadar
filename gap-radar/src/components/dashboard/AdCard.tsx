"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdCreative } from '@/types';
import { ExternalLink, Calendar, PlayCircle, Image as ImageIcon } from 'lucide-react';

interface AdCardProps {
  ad: AdCreative;
  onClick: (ad: AdCreative) => void;
}

function getMediaIcon(mediaType: string) {
  switch (mediaType) {
    case 'video':
      return <PlayCircle className="h-4 w-4" />;
    case 'image':
      return <ImageIcon className="h-4 w-4" />;
    case 'carousel':
      return <ImageIcon className="h-4 w-4" />;
    default:
      return null;
  }
}

function getSourceBadgeColor(source: string) {
  switch (source.toLowerCase()) {
    case 'meta':
      return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'google':
      return 'bg-green-500/10 text-green-600 border-green-200';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-200';
  }
}

function formatDaysRunning(daysRunning?: number): string {
  if (!daysRunning) return 'New';
  if (daysRunning === 1) return '1 day';
  if (daysRunning < 30) return `${daysRunning} days`;
  if (daysRunning < 60) return '1 month';
  if (daysRunning < 365) return `${Math.floor(daysRunning / 30)} months`;
  return `${Math.floor(daysRunning / 365)}+ years`;
}

function getLongevityColor(daysRunning?: number): string {
  if (!daysRunning) return 'text-gray-600';
  if (daysRunning >= 180) return 'text-green-600'; // 6+ months = winning signal
  if (daysRunning >= 90) return 'text-blue-600'; // 3+ months = strong
  if (daysRunning >= 30) return 'text-yellow-600'; // 1+ month = testing
  return 'text-gray-600'; // < 1 month = new
}

export function AdCard({ ad, onClick }: AdCardProps) {
  const longevityColorClass = getLongevityColor(ad.daysRunning);
  const sourceBadgeClass = getSourceBadgeColor(ad.source);

  return (
    <button
      onClick={() => onClick(ad)}
      data-testid="ad-card"
      className="w-full text-left transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
    >
      <Card className="h-full border hover:border-primary/50 hover:shadow-lg transition-all">
        <CardContent className="p-4 space-y-3">
          {/* Header: Source Badge + Media Type */}
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className={sourceBadgeClass}
              data-testid="ad-source"
            >
              {ad.source.toUpperCase()}
            </Badge>
            {ad.mediaType && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="ad-media-type">
                {getMediaIcon(ad.mediaType)}
                <span className="capitalize">{ad.mediaType}</span>
              </div>
            )}
          </div>

          {/* Advertiser Name */}
          <div>
            <h3
              className="font-semibold text-base leading-tight"
              data-testid="ad-advertiser"
            >
              {ad.advertiserName}
            </h3>
          </div>

          {/* Headline */}
          {ad.headline && (
            <p
              className="text-sm font-medium line-clamp-2"
              data-testid="ad-headline"
            >
              {ad.headline}
            </p>
          )}

          {/* Creative Text */}
          {ad.creativeText && (
            <p
              className="text-sm text-muted-foreground line-clamp-3"
              data-testid="ad-text"
            >
              {ad.creativeText}
            </p>
          )}

          {/* CTA */}
          {ad.cta && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {ad.cta}
              </Badge>
            </div>
          )}

          {/* Footer: Longevity + Landing URL */}
          <div className="flex items-center justify-between pt-2 border-t text-xs">
            <div
              className={`flex items-center gap-1.5 ${longevityColorClass} font-medium`}
              data-testid="ad-longevity"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDaysRunning(ad.daysRunning)}</span>
            </div>
            {ad.landingUrl && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* Date Range */}
          {ad.firstSeen && (
            <div
              className="text-xs text-muted-foreground"
              data-testid="ad-dates"
            >
              {ad.firstSeen instanceof Date
                ? ad.firstSeen.toLocaleDateString()
                : new Date(ad.firstSeen).toLocaleDateString()}
              {ad.lastSeen && ad.isActive && ' → Active'}
            </div>
          )}
        </CardContent>
      </Card>
    </button>
  );
}

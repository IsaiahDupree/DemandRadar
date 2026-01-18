"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AdCreative } from '@/types';
import {
  ExternalLink,
  Calendar,
  TrendingUp,
  Copy,
  Download,
  Bookmark,
  PlayCircle,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

interface AdDetailModalProps {
  ad: AdCreative | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getMediaIcon(mediaType: string) {
  switch (mediaType) {
    case 'video':
      return <PlayCircle className="h-5 w-5" />;
    case 'carousel':
      return <Layers className="h-5 w-5" />;
    case 'image':
    default:
      return <ImageIcon className="h-5 w-5" />;
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

function getLongevityColor(daysRunning?: number): string {
  if (!daysRunning) return 'text-gray-600';
  if (daysRunning >= 180) return 'text-green-600'; // 6+ months = winning signal
  if (daysRunning >= 90) return 'text-blue-600'; // 3+ months = strong
  if (daysRunning >= 30) return 'text-yellow-600'; // 1+ month = testing
  return 'text-gray-600'; // < 1 month = new
}

export function AdDetailModal({ ad, open, onOpenChange }: AdDetailModalProps) {
  if (!ad) return null;

  const handleCopyText = async () => {
    if (ad.creativeText) {
      await navigator.clipboard.writeText(ad.creativeText);
      // TODO: Show toast notification
    }
  };

  const handleSave = () => {
    // TODO: Implement save to user's saved ads
    console.log('Save ad:', ad.id);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    const dataStr = JSON.stringify(ad, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ad-${ad.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const longevityColor = getLongevityColor(ad.daysRunning);
  const sourceBadgeClass = getSourceBadgeColor(ad.source);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        data-testid="ad-detail-modal"
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2" data-testid="modal-advertiser">
                {ad.advertiserName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={sourceBadgeClass}
                  data-testid="modal-source"
                >
                  {ad.source.toUpperCase()}
                </Badge>
                {ad.isActive && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-200">
                    Active
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-muted-foreground">
                  {getMediaIcon(ad.mediaType)}
                  <span className="text-xs capitalize">{ad.mediaType}</span>
                </div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Performance Metrics Section */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg" data-testid="performance-metrics">
            {ad.daysRunning !== undefined && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Days Running</p>
                <div className={`flex items-center gap-2 font-semibold ${longevityColor}`}>
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-lg">{ad.daysRunning}</span>
                </div>
              </div>
            )}

            {ad.firstSeen && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">First Seen</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {ad.firstSeen instanceof Date
                      ? ad.firstSeen.toLocaleDateString()
                      : new Date(ad.firstSeen).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {ad.lastSeen && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Seen</p>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {ad.lastSeen instanceof Date
                      ? ad.lastSeen.toLocaleDateString()
                      : new Date(ad.lastSeen).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Ad Content Section */}
          <div className="space-y-4" data-testid="ad-content">
            {ad.headline && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Headline</h3>
                <p className="text-base font-semibold" data-testid="modal-headline">
                  {ad.headline}
                </p>
              </div>
            )}

            {ad.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm" data-testid="modal-description">
                  {ad.description}
                </p>
              </div>
            )}

            {ad.creativeText && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Creative Text</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyText}
                    className="h-8 gap-2"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap" data-testid="modal-creative-text">
                  {ad.creativeText}
                </p>
              </div>
            )}

            {ad.cta && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Call to Action</h3>
                <Badge variant="secondary" className="text-sm" data-testid="modal-cta">
                  {ad.cta}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Landing URL Section */}
          {ad.landingUrl && (
            <div className="space-y-2" data-testid="landing-url-section">
              <h3 className="text-sm font-medium text-muted-foreground">Landing Page</h3>
              <a
                href={ad.landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                data-testid="modal-landing-url"
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                {ad.landingUrl}
              </a>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            className="gap-2"
            data-testid="save-ad-button"
          >
            <Bookmark className="h-4 w-4" />
            Save Ad
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
            data-testid="export-ad-button"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          {ad.landingUrl && (
            <Button asChild>
              <a
                href={ad.landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Page
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

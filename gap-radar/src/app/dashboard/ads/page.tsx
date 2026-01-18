"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdGrid } from "@/components/dashboard/AdGrid";
import { AdDetailModal } from "@/components/dashboard/AdDetailModal";
import { AdCreative } from '@/types';
import { Search, Filter, Play } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface AdFilters {
  source: string;
  mediaType: string;
  search: string;
}

export default function AdsDiscoveryPage() {
  const [ads, setAds] = useState<AdCreative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<AdCreative | null>(null);
  const [filters, setFilters] = useState<AdFilters>({
    source: 'all',
    mediaType: 'all',
    search: '',
  });

  // Fetch ads from Supabase
  useEffect(() => {
    async function fetchAds() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Please sign in to view ads');
          return;
        }

        // Fetch ads from runs owned by this user
        const { data, error: fetchError } = await supabase
          .from('ad_creatives')
          .select(`
            id,
            run_id,
            source,
            advertiser_name,
            creative_text,
            headline,
            description,
            cta,
            landing_url,
            first_seen,
            last_seen,
            is_active,
            media_type,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (fetchError) throw fetchError;

        // Transform to AdCreative type
        const transformedAds: AdCreative[] = (data || []).map((ad: any) => {
          const firstSeen = ad.first_seen ? new Date(ad.first_seen) : undefined;
          const lastSeen = ad.last_seen ? new Date(ad.last_seen) : undefined;

          let daysRunning = undefined;
          if (firstSeen) {
            const endDate = lastSeen || new Date();
            daysRunning = Math.floor((endDate.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
          }

          return {
            id: ad.id,
            runId: ad.run_id,
            source: ad.source,
            advertiserName: ad.advertiser_name || 'Unknown',
            creativeText: ad.creative_text || '',
            headline: ad.headline,
            description: ad.description,
            cta: ad.cta,
            landingUrl: ad.landing_url,
            firstSeen,
            lastSeen,
            isActive: ad.is_active ?? true,
            mediaType: ad.media_type || 'unknown',
            daysRunning,
          };
        });

        setAds(transformedAds);
      } catch (err) {
        console.error('Error fetching ads:', err);
        setError(err instanceof Error ? err.message : 'Failed to load ads');
      } finally {
        setLoading(false);
      }
    }

    fetchAds();
  }, []);

  // Filter ads based on current filters
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      // Source filter
      if (filters.source !== 'all' && ad.source !== filters.source) {
        return false;
      }

      // Media type filter
      if (filters.mediaType !== 'all' && ad.mediaType !== filters.mediaType) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesAdvertiser = ad.advertiserName.toLowerCase().includes(searchLower);
        const matchesText = ad.creativeText?.toLowerCase().includes(searchLower);
        const matchesHeadline = ad.headline?.toLowerCase().includes(searchLower);
        if (!matchesAdvertiser && !matchesText && !matchesHeadline) {
          return false;
        }
      }

      return true;
    });
  }, [ads, filters]);

  const handleAdClick = (ad: AdCreative) => {
    setSelectedAd(ad);
    // TODO: Open detail modal or navigate to detail page
    console.log('Ad clicked:', ad);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ad Discovery</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse and analyze collected ads from your market research
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/new-run">
            <Play className="mr-2 h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="filter-panel">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ads..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Source Filter */}
            <Select
              value={filters.source}
              onValueChange={(value) => setFilters({ ...filters, source: value })}
            >
              <SelectTrigger data-testid="filter-source">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="meta">Meta</SelectItem>
                <SelectItem value="google">Google</SelectItem>
              </SelectContent>
            </Select>

            {/* Media Type Filter */}
            <Select
              value={filters.mediaType}
              onValueChange={(value) => setFilters({ ...filters, mediaType: value })}
            >
              <SelectTrigger data-testid="filter-media-type">
                <SelectValue placeholder="Media Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="carousel">Carousel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Count */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAds.length} of {ads.length} ads
            </p>
            {(filters.source !== 'all' || filters.mediaType !== 'all' || filters.search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ source: 'all', mediaType: 'all', search: '' })}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {!error && ads.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">
              No ads found. Run an analysis to collect ad data.
            </p>
            <Button asChild>
              <Link href="/dashboard/new-run">
                <Play className="mr-2 h-4 w-4" />
                Start Analysis
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && (filteredAds.length > 0 || loading) && (
        <AdGrid
          ads={filteredAds}
          onAdClick={handleAdClick}
          isLoading={loading}
        />
      )}

      {!error && !loading && ads.length > 0 && filteredAds.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No ads match your current filters. Try adjusting your search.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ad Detail Modal */}
      <AdDetailModal
        ad={selectedAd}
        open={!!selectedAd}
        onOpenChange={(open) => {
          if (!open) setSelectedAd(null);
        }}
      />
    </div>
  );
}

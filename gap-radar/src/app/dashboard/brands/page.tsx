"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, Target, Activity, ExternalLink, ArrowUpDown } from "lucide-react";
import Link from "next/link";

interface BrandData {
  advertiser_name: string;
  total_ads: number;
  active_ads: number;
  avg_longevity_days: number;
  first_seen: string;
  last_seen: string;
  gaps_found: number;
}

type SortColumn = 'total_ads' | 'active_ads' | 'avg_longevity_days' | 'gaps_found';
type SortDirection = 'asc' | 'desc';

export default function BrandLeaderboardPage() {
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn>('total_ads');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const supabase = createClient();

      // Aggregate brand data from ad_creatives table
      const { data, error } = await supabase.rpc('get_brand_leaderboard');

      if (error) {
        // Fallback to manual aggregation if RPC doesn't exist
        const { data: adsData, error: adsError } = await supabase
          .from('ad_creatives')
          .select('advertiser_name, first_seen, last_seen, is_active, run_id');

        if (adsError) throw adsError;

        // Manually aggregate the data
        const brandMap = new Map<string, BrandData>();

        adsData?.forEach((ad) => {
          if (!ad.advertiser_name) return;

          const existing = brandMap.get(ad.advertiser_name);
          const firstSeen = new Date(ad.first_seen || Date.now());
          const lastSeen = new Date(ad.last_seen || Date.now());
          const longevityDays = Math.floor(
            (lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (existing) {
            existing.total_ads += 1;
            existing.active_ads += ad.is_active ? 1 : 0;
            existing.avg_longevity_days = Math.floor(
              (existing.avg_longevity_days * (existing.total_ads - 1) + longevityDays) /
                existing.total_ads
            );
            if (firstSeen < new Date(existing.first_seen)) {
              existing.first_seen = ad.first_seen;
            }
            if (lastSeen > new Date(existing.last_seen)) {
              existing.last_seen = ad.last_seen;
            }
          } else {
            brandMap.set(ad.advertiser_name, {
              advertiser_name: ad.advertiser_name,
              total_ads: 1,
              active_ads: ad.is_active ? 1 : 0,
              avg_longevity_days: longevityDays,
              first_seen: ad.first_seen || new Date().toISOString(),
              last_seen: ad.last_seen || new Date().toISOString(),
              gaps_found: 0, // Will be populated separately
            });
          }
        });

        // Get gaps count per brand (from gap_opportunities table)
        const { data: gapsData } = await supabase
          .from('gap_opportunities')
          .select('run_id, evidence_ads');

        // Map run_ids to brands from evidence
        const gapCounts = new Map<string, number>();
        gapsData?.forEach((gap) => {
          const evidenceAds = (gap.evidence_ads || []) as Array<{ advertiser_name?: string }>;
          evidenceAds.forEach((evidence) => {
            if (evidence.advertiser_name) {
              gapCounts.set(
                evidence.advertiser_name,
                (gapCounts.get(evidence.advertiser_name) || 0) + 1
              );
            }
          });
        });

        // Update brands with gap counts
        brandMap.forEach((brand) => {
          brand.gaps_found = gapCounts.get(brand.advertiser_name) || 0;
        });

        setBrands(Array.from(brandMap.values()));
      } else {
        setBrands(data || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  }

  const sortedBrands = [...brands].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (aVal - bVal) * multiplier;
  });

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" role="status" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Brand Leaderboard</h1>
        <p className="text-muted-foreground">
          Track top brands by advertising activity, gaps found, and market presence
        </p>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Button
          variant={sortColumn === 'total_ads' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('total_ads')}
          aria-label="sort by total ads"
        >
          Total Ads
          {sortColumn === 'total_ads' && <ArrowUpDown className="ml-2 h-3 w-3" />}
        </Button>
        <Button
          variant={sortColumn === 'active_ads' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('active_ads')}
          aria-label="sort by active ads"
        >
          Active Ads
          {sortColumn === 'active_ads' && <ArrowUpDown className="ml-2 h-3 w-3" />}
        </Button>
        <Button
          variant={sortColumn === 'avg_longevity_days' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('avg_longevity_days')}
          aria-label="sort by longevity"
        >
          Longevity
          {sortColumn === 'avg_longevity_days' && <ArrowUpDown className="ml-2 h-3 w-3" />}
        </Button>
        <Button
          variant={sortColumn === 'gaps_found' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSort('gaps_found')}
          aria-label="sort by gaps found"
        >
          Gaps Found
          {sortColumn === 'gaps_found' && <ArrowUpDown className="ml-2 h-3 w-3" />}
        </Button>
      </div>

      {sortedBrands.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No brands found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Run analyses to start collecting brand data from ad platforms
            </p>
            <Link href="/dashboard/new-run">
              <Button>Start Your First Analysis</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="brand-leaderboard-container">
          {sortedBrands.map((brand, index) => (
            <Card key={brand.advertiser_name} data-testid={`brand-card-${brand.advertiser_name}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <CardTitle className="text-xl">
                        {brand.advertiser_name}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Active from {formatDate(brand.first_seen)} to {formatDate(brand.last_seen)}
                    </p>
                  </div>
                  <Link href={`/dashboard/brands/${encodeURIComponent(brand.advertiser_name)}`}>
                    <Button variant="outline" size="sm">
                      View Details
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Total Ads</span>
                    </div>
                    <span className="text-2xl font-bold">{brand.total_ads}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Active Ads</span>
                    </div>
                    <span className="text-2xl font-bold">{brand.active_ads}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm">Avg Longevity</span>
                    </div>
                    <span className="text-2xl font-bold">{brand.avg_longevity_days}d</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Target className="h-4 w-4" />
                      <span className="text-sm">Gaps Found</span>
                    </div>
                    <span className="text-2xl font-bold">{brand.gaps_found}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

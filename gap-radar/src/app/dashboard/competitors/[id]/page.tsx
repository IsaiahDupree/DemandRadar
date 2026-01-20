"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Trash2,
} from "lucide-react";

interface TrackedCompetitor {
  id: string;
  competitor_name: string;
  competitor_domain: string | null;
  is_active: boolean;
  last_checked: string | null;
  created_at: string;
  user_id: string;
}

interface CompetitorSnapshot {
  id: string;
  competitor_id: string;
  snapshot_date: string;
  active_ads_count: number;
  new_ads_count: number;
  stopped_ads_count: number;
  ads_data: any;
  changes: any;
  created_at: string;
}

interface AdData {
  id: string;
  headline?: string;
  body?: string;
  hook?: string;
  started_date?: string;
  run_days?: number;
  image_url?: string;
}

interface CreativePattern {
  pattern: string;
  description: string;
}

export default function CompetitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const competitorId = params.id as string;

  const [competitor, setCompetitor] = useState<TrackedCompetitor | null>(null);
  const [snapshots, setSnapshots] = useState<CompetitorSnapshot[]>([]);
  const [currentSnapshot, setCurrentSnapshot] = useState<CompetitorSnapshot | null>(null);
  const [previousSnapshot, setPreviousSnapshot] = useState<CompetitorSnapshot | null>(null);
  const [newAds, setNewAds] = useState<AdData[]>([]);
  const [topPerformingAds, setTopPerformingAds] = useState<AdData[]>([]);
  const [patterns, setPatterns] = useState<CreativePattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetitorData();
  }, [competitorId]);

  async function fetchCompetitorData() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view competitor details');
        setLoading(false);
        return;
      }

      // Fetch competitor details
      const { data: competitorData, error: competitorError } = await supabase
        .from('tracked_competitors')
        .select('*')
        .eq('id', competitorId)
        .eq('user_id', user.id)
        .single();

      if (competitorError) {
        if (competitorError.code === 'PGRST116') {
          setError('Competitor not found');
        } else {
          throw competitorError;
        }
        setLoading(false);
        return;
      }

      setCompetitor(competitorData);

      // Fetch snapshots (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: snapshotsData, error: snapshotsError } = await supabase
        .from('competitor_snapshots')
        .select('*')
        .eq('competitor_id', competitorId)
        .gte('snapshot_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: false });

      if (snapshotsError) throw snapshotsError;

      setSnapshots(snapshotsData || []);

      // Get current and previous snapshot
      if (snapshotsData && snapshotsData.length > 0) {
        const current = snapshotsData[0];
        setCurrentSnapshot(current);

        if (snapshotsData.length > 1) {
          setPreviousSnapshot(snapshotsData[1]);
        }

        // Extract ads data from current snapshot
        if (current.ads_data) {
          const adsArray = Array.isArray(current.ads_data) ? current.ads_data : [];

          // Identify new ads (started in last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const newAdsFiltered = adsArray.filter((ad: any) => {
            if (ad.started_date) {
              const startedDate = new Date(ad.started_date);
              return startedDate >= sevenDaysAgo;
            }
            return false;
          }).slice(0, 6); // Limit to 6 ads

          setNewAds(newAdsFiltered);

          // Identify top performing ads (running 30+ days)
          const topAds = adsArray
            .filter((ad: any) => ad.run_days && ad.run_days >= 30)
            .sort((a: any, b: any) => (b.run_days || 0) - (a.run_days || 0))
            .slice(0, 6); // Limit to 6 ads

          setTopPerformingAds(topAds);

          // Detect patterns
          detectCreativePatterns(adsArray);
        }
      }
    } catch (err: any) {
      console.error('Error fetching competitor data:', err);
      setError(err.message || 'Failed to load competitor data');
    } finally {
      setLoading(false);
    }
  }

  function detectCreativePatterns(ads: any[]) {
    const detectedPatterns: CreativePattern[] = [];

    if (ads.length === 0) {
      setPatterns([]);
      return;
    }

    // Simple pattern detection based on ad content
    // Count UGC-style indicators
    const ugcCount = ads.filter((ad) => {
      const text = `${ad.headline || ''} ${ad.body || ''} ${ad.hook || ''}`.toLowerCase();
      return text.includes('real') || text.includes('customer') || text.includes('testimonial');
    }).length;

    if (ugcCount > ads.length * 0.3) {
      detectedPatterns.push({
        pattern: 'Heavy use of UGC-style content',
        description: `${Math.round((ugcCount / ads.length) * 100)}% of ads feature user-generated or testimonial-style content`,
      });
    }

    // Count problem-agitation hooks
    const problemCount = ads.filter((ad) => {
      const text = `${ad.headline || ''} ${ad.body || ''} ${ad.hook || ''}`.toLowerCase();
      return text.includes('tired of') || text.includes('struggling') || text.includes('problem') || text.includes('frustrated');
    }).length;

    if (problemCount > ads.length * 0.3) {
      detectedPatterns.push({
        pattern: 'Problem-agitation hooks dominate',
        description: `${Math.round((problemCount / ads.length) * 100)}% of ads start with pain point identification`,
      });
    }

    // Count free trial mentions
    const trialCount = ads.filter((ad) => {
      const text = `${ad.headline || ''} ${ad.body || ''} ${ad.hook || ''}`.toLowerCase();
      return text.includes('free trial') || text.includes('try free') || text.includes('start free');
    }).length;

    if (trialCount > ads.length * 0.3) {
      detectedPatterns.push({
        pattern: 'Consistent "free trial" CTA',
        description: `${Math.round((trialCount / ads.length) * 100)}% of ads offer a free trial as the primary call-to-action`,
      });
    }

    // If no patterns detected, add a default message
    if (detectedPatterns.length === 0 && ads.length >= 5) {
      detectedPatterns.push({
        pattern: 'Mixed creative approach',
        description: 'No dominant patterns detected - diverse creative testing strategy',
      });
    }

    setPatterns(detectedPatterns);
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }

  function getTrendIcon(current: number, previous: number) {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to stop tracking ${competitor?.competitor_name}?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tracked_competitors')
        .delete()
        .eq('id', competitorId);

      if (error) throw error;

      router.push('/dashboard/competitors');
    } catch (err: any) {
      console.error('Error deleting competitor:', err);
      alert('Failed to delete competitor');
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="Error"
              description={error}
              action={
                <Link href="/dashboard/competitors">
                  <Button>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Competitors
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!competitor) {
    return null;
  }

  const weeklyNewCount = currentSnapshot?.new_ads_count || 0;
  const weeklyStoppedCount = currentSnapshot?.stopped_ads_count || 0;
  const activeAdsCount = currentSnapshot?.active_ads_count || 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard/competitors"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{competitor.competitor_name}</h1>
            <Badge variant="outline">Active</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {competitor.competitor_domain && (
              <span>{competitor.competitor_domain}</span>
            )}
            <span className="flex items-center gap-1">
              <span className="font-medium">{activeAdsCount}</span> Active Ads
            </span>
            <span>Tracking since {new Date(competitor.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Ad Activity Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📈 Ad Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">This Week</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">{weeklyNewCount} new</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="font-semibold">{weeklyStoppedCount} stopped</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">This Month</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {snapshots.slice(0, 4).reduce((sum, s) => sum + (s.new_ads_count || 0), 0)} new
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {snapshots.slice(0, 4).reduce((sum, s) => sum + (s.stopped_ads_count || 0), 0)} stopped
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Overall Trend</p>
              <div className="flex items-center gap-2">
                {previousSnapshot && getTrendIcon(activeAdsCount, previousSnapshot.active_ads_count)}
                <span className="font-semibold">
                  {previousSnapshot
                    ? activeAdsCount > previousSnapshot.active_ads_count
                      ? 'Growing'
                      : activeAdsCount < previousSnapshot.active_ads_count
                      ? 'Declining'
                      : 'Stable'
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Ads This Week */}
      <Card>
        <CardHeader>
          <CardTitle>🆕 New Ads This Week</CardTitle>
          <CardDescription>
            Recently launched campaigns in the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {newAds.length === 0 ? (
            <EmptyState
              title="No New Ads This Week"
              description="No new ad campaigns detected in the past 7 days"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newAds.map((ad, index) => (
                <div
                  key={ad.id || index}
                  data-testid="ad-preview"
                  className="border rounded-lg p-4 space-y-2"
                >
                  {ad.image_url && (
                    <div className="w-full h-40 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={ad.image_url}
                        alt="Ad preview"
                        data-testid="ad-image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Hook: {ad.hook || ad.headline || 'No hook available'}
                    </p>
                    {ad.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {ad.body}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Started: {ad.started_date ? formatTimeAgo(ad.started_date) : 'Unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Ads */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Top Performing Ads (30+ days)</CardTitle>
          <CardDescription>
            Long-running campaigns that are still active
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topPerformingAds.length === 0 ? (
            <EmptyState
              title="No Long-Running Ads"
              description="No ads have been running for 30+ days yet"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPerformingAds.map((ad, index) => (
                <div
                  key={ad.id || index}
                  data-testid="ad-preview"
                  className="border rounded-lg p-4 space-y-2"
                >
                  {ad.image_url && (
                    <div className="w-full h-40 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={ad.image_url}
                        alt="Ad preview"
                        data-testid="ad-image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        Running: {ad.run_days} days
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      Hook: {ad.hook || ad.headline || 'No hook available'}
                    </p>
                    {ad.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {ad.body}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Creative Patterns Detected */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Creative Patterns Detected</CardTitle>
          <CardDescription>
            Analysis of creative strategy and messaging trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patterns.length === 0 ? (
            <EmptyState
              title="No Patterns Detected"
              description="Not enough data to identify creative patterns yet. Check back after more ads are collected."
            />
          ) : (
            <ul className="space-y-3" data-testid="pattern-list">
              {patterns.map((pattern, index) => (
                <li key={index} data-testid="pattern-item" className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <div>
                    <p className="font-medium">{pattern.pattern}</p>
                    {pattern.description && (
                      <p className="text-sm text-muted-foreground">{pattern.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

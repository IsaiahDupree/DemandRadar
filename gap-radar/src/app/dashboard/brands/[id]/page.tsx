"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockAdCreatives, mockGapOpportunities } from "@/lib/mock-data";
import { ArrowLeft, Star, ExternalLink, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

function getGapTypeBadge(type: string) {
  const colors: Record<string, string> = {
    product: "bg-blue-500/10 text-blue-600",
    offer: "bg-green-500/10 text-green-600",
    positioning: "bg-purple-500/10 text-purple-600",
    trust: "bg-yellow-500/10 text-yellow-600",
    pricing: "bg-red-500/10 text-red-600",
  };
  return (
    <Badge className={`${colors[type] || "bg-gray-500/10 text-gray-600"} border-0`}>
      {type}
    </Badge>
  );
}

export default function BrandDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;

  const [isTracking, setIsTracking] = useState(false);

  // Get all ads for this brand
  const brandAds = useMemo(() => {
    return mockAdCreatives.filter(ad =>
      ad.id === brandId || ad.advertiserName.toLowerCase().replace(/\s+/g, '-') === brandId
    );
  }, [brandId]);

  // Get the brand name from the first ad or use a placeholder
  const brandName = useMemo(() => {
    if (brandAds.length > 0) {
      return brandAds[0].advertiserName;
    }
    // For mock purposes, if brandId is test-brand-1, return first advertiser
    if (brandId === 'test-brand-1') {
      return mockAdCreatives[0]?.advertiserName || 'WatermarkRemover Pro';
    }
    return 'Unknown Brand';
  }, [brandAds, brandId]);

  // For mock purposes, if test-brand-1, show all ads from first advertiser
  const displayAds = useMemo(() => {
    if (brandId === 'test-brand-1') {
      const firstAdvertiser = mockAdCreatives[0]?.advertiserName;
      return mockAdCreatives.filter(ad => ad.advertiserName === firstAdvertiser);
    }
    return brandAds;
  }, [brandId, brandAds]);

  // Get gaps related to this brand (simplified - in production would be based on actual data relationships)
  const relatedGaps = useMemo(() => {
    // For mock, just return first few gaps
    return mockGapOpportunities.slice(0, 3);
  }, []);

  // Calculate brand metrics
  const metrics = useMemo(() => {
    const totalAds = displayAds.length;
    const activeAds = displayAds.filter(ad => ad.isActive).length;
    const avgDaysRunning = displayAds.reduce((sum, ad) => sum + (ad.daysRunning || 0), 0) / (totalAds || 1);
    const longestRunning = Math.max(...displayAds.map(ad => ad.daysRunning || 0));

    return {
      totalAds,
      activeAds,
      avgDaysRunning: Math.round(avgDaysRunning),
      longestRunning,
    };
  }, [displayAds]);

  const handleTrackToggle = () => {
    setIsTracking(!isTracking);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with back button */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/dashboard/gaps"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Gaps
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{brandName}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Competitor analysis and market positioning
          </p>
        </div>
        <Button
          onClick={handleTrackToggle}
          variant={isTracking ? "default" : "outline"}
          data-testid="track-brand-button"
        >
          <Star className={`h-4 w-4 mr-2 ${isTracking ? 'fill-current' : ''}`} />
          {isTracking ? 'Tracking' : 'Track Brand'}
        </Button>
      </div>

      {/* Brand Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAds}</div>
            <p className="text-xs text-muted-foreground">{metrics.activeAds} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Days Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgDaysRunning}</div>
            <p className="text-xs text-muted-foreground">per creative</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Longest Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.longestRunning}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ad Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1">
              {displayAds.some(ad => ad.source === 'meta') && (
                <Badge variant="outline" className="text-xs">Meta</Badge>
              )}
              {displayAds.some(ad => ad.source === 'google') && (
                <Badge variant="outline" className="text-xs">Google</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ads" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ads" className="text-xs sm:text-sm">Ad Creatives</TabsTrigger>
          <TabsTrigger value="gaps" className="text-xs sm:text-sm">Related Gaps</TabsTrigger>
        </TabsList>

        {/* Ads Tab */}
        <TabsContent value="ads" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {displayAds.map((ad) => (
              <Card key={ad.id} data-testid="brand-ad-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{ad.source}</Badge>
                        <Badge variant="outline" className="text-xs">{ad.mediaType}</Badge>
                        {ad.isActive && (
                          <Badge className="bg-green-500/10 text-green-600 border-0 text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{ad.headline || 'No headline'}</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-muted-foreground">
                        {ad.daysRunning || 0} days
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{ad.creativeText}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {ad.cta && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>CTA: {ad.cta}</span>
                      </div>
                    )}
                    {ad.firstSeen && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Since {new Date(ad.firstSeen).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {ad.landingUrl && (
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <a href={ad.landingUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-2" />
                        View Landing Page
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {displayAds.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground mb-2">No ads found</p>
                <p className="text-sm text-muted-foreground">
                  This brand doesn't have any ads in our database yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Gaps Tab */}
        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Related Gaps</CardTitle>
              <CardDescription>
                Market gaps identified that relate to this competitor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relatedGaps.map((gap, index) => (
                  <div key={gap.id} className="p-4 border rounded-lg space-y-3" data-testid="brand-gap-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{gap.title}</h4>
                            {getGapTypeBadge(gap.gapType)}
                          </div>
                          <p className="text-sm text-muted-foreground">{gap.problem}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{gap.opportunityScore}</div>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(gap.confidence * 100)}% confidence
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <p className="text-sm">{gap.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

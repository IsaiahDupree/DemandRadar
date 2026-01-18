"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { mockGapOpportunities, mockClusters, mockAdCreatives, mockRedditMentions } from "@/lib/mock-data";
import { Target, MessageSquare, ShoppingBag, Lightbulb, ArrowRight, Quote, ExternalLink, Search, Grid3x3, List, X, Bookmark } from "lucide-react";

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

type ViewMode = 'grid' | 'list';
type GapType = 'all' | 'product' | 'offer' | 'positioning' | 'trust' | 'pricing';

export default function GapsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<GapType[]>(['all']);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [savedGapIds, setSavedGapIds] = useState<Set<string>>(new Set());

  // Filter gaps based on search and filters
  const filteredGaps = useMemo(() => {
    let gaps = mockGapOpportunities;

    // Apply gap type filters
    if (!selectedFilters.includes('all')) {
      gaps = gaps.filter(gap => selectedFilters.includes(gap.gapType as GapType));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      gaps = gaps.filter(gap =>
        gap.title.toLowerCase().includes(query) ||
        gap.problem.toLowerCase().includes(query) ||
        gap.recommendation.toLowerCase().includes(query)
      );
    }

    return gaps;
  }, [searchQuery, selectedFilters]);

  const toggleFilter = (filter: GapType) => {
    if (filter === 'all') {
      setSelectedFilters(['all']);
    } else {
      const newFilters = selectedFilters.includes(filter)
        ? selectedFilters.filter(f => f !== filter)
        : [...selectedFilters.filter(f => f !== 'all'), filter];

      setSelectedFilters(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFilters(['all']);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || !selectedFilters.includes('all');

  const toggleSaveGap = async (gapId: string) => {
    // In production, this would call Supabase to save/unsave the gap
    setSavedGapIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gapId)) {
        newSet.delete(gapId);
      } else {
        newSet.add(gapId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gap Opportunities</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Market gaps identified from ad analysis and user sentiment
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gaps Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGapOpportunities.length}</div>
            <p className="text-xs text-muted-foreground">Across all analyses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Opportunity Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(mockGapOpportunities.reduce((a, b) => a + b.opportunityScore, 0) / mockGapOpportunities.length)}
            </div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Confidence Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockGapOpportunities.filter((g) => g.confidence > 0.8).length}
            </div>
            <p className="text-xs text-muted-foreground">&gt;80% confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filters, and View Toggles */}
      <Card data-testid="filter-panel">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gaps by title, problem, or recommendation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Buttons and View Toggles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground mr-2">Filter by type:</span>
                <Button
                  variant={selectedFilters.includes('all') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter('all')}
                  data-testid="filter-all"
                >
                  All
                </Button>
                <Button
                  variant={selectedFilters.includes('product') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter('product')}
                  data-testid="filter-product"
                  className={selectedFilters.includes('product') ? 'bg-blue-500 hover:bg-blue-600' : ''}
                >
                  Product
                </Button>
                <Button
                  variant={selectedFilters.includes('offer') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter('offer')}
                  data-testid="filter-offer"
                  className={selectedFilters.includes('offer') ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  Offer
                </Button>
                <Button
                  variant={selectedFilters.includes('positioning') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter('positioning')}
                  data-testid="filter-positioning"
                  className={selectedFilters.includes('positioning') ? 'bg-purple-500 hover:bg-purple-600' : ''}
                >
                  Positioning
                </Button>
                <Button
                  variant={selectedFilters.includes('trust') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter('trust')}
                  data-testid="filter-trust"
                  className={selectedFilters.includes('trust') ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  Trust
                </Button>
                <Button
                  variant={selectedFilters.includes('pricing') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter('pricing')}
                  data-testid="filter-pricing"
                  className={selectedFilters.includes('pricing') ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  Pricing
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="clear-filters"
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* View Toggles */}
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  data-testid="view-grid"
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  data-testid="view-list"
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
              Showing {filteredGaps.length} of {mockGapOpportunities.length} gaps
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="gaps" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gaps" className="text-xs sm:text-sm">Gap Opportunities</TabsTrigger>
          <TabsTrigger value="objections" className="text-xs sm:text-sm">User Objections</TabsTrigger>
          <TabsTrigger value="angles" className="text-xs sm:text-sm">Ad Angles</TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="space-y-4">
          <div className={viewMode === 'grid' ? 'grid gap-4' : 'space-y-4'} data-testid="gaps-container">
            {filteredGaps.length === 0 ? (
              <Card data-testid="empty-state">
                <CardContent className="py-12 text-center">
                  <p className="text-lg font-medium text-muted-foreground mb-2">No gaps found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search query
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredGaps.map((gap, index) => (
                <Card key={gap.id} data-testid="gap-card">
                  <CardHeader>
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-2">
                              <CardTitle className="text-base leading-tight" data-testid="gap-title">{gap.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                <span data-testid="gap-type">{getGapTypeBadge(gap.gapType)}</span>
                                <Badge variant="outline" className="text-xs" data-testid="gap-score">
                                  Score: {gap.opportunityScore}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleSaveGap(gap.id)}
                              data-testid="save-gap-button"
                              className="flex-shrink-0"
                            >
                              <Bookmark className={`h-4 w-4 ${savedGapIds.has(gap.id) ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
                            </Button>
                          </div>
                          <CardDescription className="text-sm">
                            {gap.problem}
                          </CardDescription>
                          <p className="text-xs text-muted-foreground" data-testid="gap-confidence">
                            {Math.round(gap.confidence * 100)}% confidence
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg" data-testid="gap-title">{gap.title}</CardTitle>
                            <span data-testid="gap-type">{getGapTypeBadge(gap.gapType)}</span>
                          </div>
                          <CardDescription className="max-w-2xl">
                            {gap.problem}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold" data-testid="gap-score">{gap.opportunityScore}</div>
                          <p className="text-xs text-muted-foreground" data-testid="gap-confidence">
                            {Math.round(gap.confidence * 100)}% confidence
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSaveGap(gap.id)}
                          data-testid="save-gap-button"
                        >
                          <Bookmark className={`h-5 w-5 ${savedGapIds.has(gap.id) ? 'fill-current text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      Ad Evidence
                    </div>
                    <div className="space-y-2">
                      {gap.evidenceAds.map((evidence) => (
                        <div key={evidence.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                          <Quote className="h-3 w-3 text-muted-foreground inline mr-1" />
                          {evidence.snippet}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      Reddit Evidence
                    </div>
                    <div className="space-y-2">
                      {gap.evidenceReddit.map((evidence) => (
                        <div key={evidence.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                          <Quote className="h-3 w-3 text-muted-foreground inline mr-1" />
                          {evidence.snippet}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
                    <Lightbulb className="h-4 w-4" />
                    3% Better Recommendation
                  </div>
                  <p className="text-sm">{gap.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
          </div>
        </TabsContent>

        <TabsContent value="objections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Objections from Reddit</CardTitle>
              <CardDescription>
                Top complaints and concerns clustered from user discussions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockClusters
                  .filter((c) => c.clusterType === "objection")
                  .map((cluster) => (
                    <div key={cluster.id} className="p-3 sm:p-4 border rounded-lg space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h4 className="font-semibold text-sm sm:text-base">{cluster.label}</h4>
                        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <span>Frequency: {cluster.frequency}</span>
                          <span>Intensity: {Math.round(cluster.intensity * 100)}%</span>
                        </div>
                      </div>
                      <Progress value={cluster.intensity * 100} className="h-2" />
                      <div className="space-y-2">
                        {cluster.examples.map((ex) => (
                          <div key={ex.id} className="p-2 bg-muted/50 rounded text-xs sm:text-sm">
                            &ldquo;{ex.snippet}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw Reddit Mentions</CardTitle>
              <CardDescription>
                Source data from user discussions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {mockRedditMentions.map((mention) => (
                    <div key={mention.id} className="p-3 sm:p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{mention.subreddit}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {mention.score} points
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" asChild>
                          <a href={`https://reddit.com${mention.permalink}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                      {mention.title && (
                        <h4 className="font-medium text-sm sm:text-base">{mention.title}</h4>
                      )}
                      <p className="text-xs sm:text-sm text-muted-foreground">{mention.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="angles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ad Angles from Competitors</CardTitle>
              <CardDescription>
                Top messaging patterns from Meta and Google ads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockClusters
                  .filter((c) => c.clusterType === "angle")
                  .map((cluster) => (
                    <div key={cluster.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{cluster.label}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Used by {cluster.frequency}% of ads</span>
                        </div>
                      </div>
                      <Progress value={cluster.frequency} className="h-2" />
                      <div className="space-y-2">
                        {cluster.examples.map((ex) => (
                          <div key={ex.id} className="p-2 bg-muted/50 rounded text-sm">
                            &ldquo;{ex.snippet}&rdquo;
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Ads</CardTitle>
              <CardDescription>
                Longest-running ad creatives (longevity signal)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {mockAdCreatives
                    .sort((a, b) => (b.daysRunning || 0) - (a.daysRunning || 0))
                    .map((ad) => (
                      <div key={ad.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{ad.source}</Badge>
                            <span className="font-medium">{ad.advertiserName}</span>
                          </div>
                          <Badge className="bg-green-500/10 text-green-600 border-0">
                            {ad.daysRunning} days
                          </Badge>
                        </div>
                        <p className="text-sm">{ad.creativeText}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Headline: {ad.headline}</span>
                          <span>CTA: {ad.cta}</span>
                          <span>Type: {ad.mediaType}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

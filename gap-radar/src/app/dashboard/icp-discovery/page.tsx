'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Target, 
  TrendingUp, 
  Users, 
  Lightbulb,
  Loader2,
  ChevronRight,
  FileText,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface TargetingInference {
  adId: string;
  advertiserName: string;
  adPreview: string;
  inferredAudience: {
    primaryICP: string;
    secondaryICPs: string[];
    businessType: string[];
    companySize: string;
    industryVerticals: string[];
    rolesTitles: string[];
  };
  painPointsAddressed: string[];
  desiresAppealed: string[];
  messagingAnalysis: {
    primaryAngle: string;
    valueProposition: string;
    differentiator: string;
    urgencyTriggers: string[];
    socialProofElements: string[];
    ctaType: string;
  };
  copywritingInsights: {
    hookStyle: string;
    toneOfVoice: string;
    readingLevel: string;
    emotionalTriggers: string[];
    persuasionTechniques: string[];
  };
  relevanceScore: number;
  relevanceReasoning: string;
  confidence: number;
}

interface ICPOpportunity {
  icpName: string;
  adCount: number;
  commonPainPoints: string[];
  commonAngles: string[];
  advertisersTargeting: string[];
  opportunityInsight: string;
  recommendedApproach: string;
}

interface DiscoveryResults {
  success: boolean;
  preset: {
    id: string;
    name: string;
    description: string;
  };
  results: {
    ads: TargetingInference[];
    summary: {
      totalAdsAnalyzed: number;
      topICPs: { icp: string; count: number }[];
      topPainPoints: { painPoint: string; count: number }[];
      topAngles: { angle: string; count: number }[];
      avgRelevanceScore: number;
      highRelevanceAds: number;
    };
    icpOpportunities: ICPOpportunity[];
  };
  redditInsights?: {
    totalMentions: number;
    topSubreddits: { subreddit: string; count: number }[];
    topPainPoints: string[];
  };
}

export default function ICPDiscoveryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DiscoveryResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAd, setSelectedAd] = useState<TargetingInference | null>(null);

  const runDiscovery = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/demand/icp-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset: 'copywriting',
          geo: 'US',
          maxAds: 30,
          minRelevanceScore: 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Discovery failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ICP Discovery</h1>
          <p className="text-muted-foreground mt-1">
            Find ads targeting businesses that need copywriting services
          </p>
        </div>
        <Button 
          onClick={runDiscovery} 
          disabled={isLoading}
          size="lg"
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Run Discovery
            </>
          )}
        </Button>
      </div>

      {/* Preset Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Copywriting Services ICP Discovery</CardTitle>
          </div>
          <CardDescription>
            Searches for ads targeting coaches, consultants, agencies, course creators, and SaaS companies - 
            all businesses that typically need copywriting services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Email Marketing</Badge>
            <Badge variant="secondary">Landing Pages</Badge>
            <Badge variant="secondary">Sales Funnels</Badge>
            <Badge variant="secondary">Business Coaches</Badge>
            <Badge variant="secondary">Marketing Agencies</Badge>
            <Badge variant="secondary">Course Creators</Badge>
            <Badge variant="secondary">SaaS Companies</Badge>
            <Badge variant="secondary">+50 more keywords</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Running ICP Discovery...</p>
                <p className="text-sm text-muted-foreground">
                  Collecting ads and analyzing targeting with AI
                </p>
              </div>
              <Progress value={33} className="w-64" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && !isLoading && (
        <Tabs defaultValue="opportunities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="opportunities" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="ads" className="gap-2">
              <FileText className="h-4 w-4" />
              Ads ({results.results.ads.length})
            </TabsTrigger>
            <TabsTrigger value="reddit" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Reddit
            </TabsTrigger>
          </TabsList>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-4">
            <div className="grid gap-4">
              {results.results.icpOpportunities.map((opp, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-lg">{opp.icpName}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {opp.adCount} ads found
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Opportunity Insight</p>
                      <p className="text-sm">{opp.opportunityInsight}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Recommended Approach</p>
                      <p className="text-sm">{opp.recommendedApproach}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Common Pain Points</p>
                        <div className="flex flex-wrap gap-1">
                          {opp.commonPainPoints.map((pp, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">{pp}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Advertisers in Space</p>
                        <div className="flex flex-wrap gap-1">
                          {opp.advertisersTargeting.map((adv, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{adv}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {results.results.icpOpportunities.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No ICP opportunities identified. Try running discovery with different keywords.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ads Analyzed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{results.results.summary.totalAdsAnalyzed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">High Relevance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{results.results.summary.highRelevanceAds}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Relevance Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{results.results.summary.avgRelevanceScore}%</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Top ICPs Targeted</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.results.summary.topICPs.slice(0, 5).map((icp, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span>{icp.icp}</span>
                        <Badge variant="secondary">{icp.count}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Top Pain Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.results.summary.topPainPoints.slice(0, 5).map((pp, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate pr-2">{pp.painPoint}</span>
                        <Badge variant="secondary">{pp.count}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Top Angles Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.results.summary.topAngles.slice(0, 5).map((angle, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span>{angle.angle}</span>
                        <Badge variant="secondary">{angle.count}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-4">
            <div className="grid gap-4">
              {results.results.ads.map((ad, i) => (
                <Card 
                  key={i} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedAd?.adId === ad.adId ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedAd(selectedAd?.adId === ad.adId ? null : ad)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{ad.advertiserName}</CardTitle>
                        <Badge 
                          variant={ad.relevanceScore >= 70 ? 'default' : ad.relevanceScore >= 40 ? 'secondary' : 'outline'}
                        >
                          {ad.relevanceScore}% relevant
                        </Badge>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        selectedAd?.adId === ad.adId ? 'rotate-90' : ''
                      }`} />
                    </div>
                    <CardDescription className="line-clamp-2">{ad.adPreview}</CardDescription>
                  </CardHeader>
                  
                  {selectedAd?.adId === ad.adId && (
                    <CardContent className="pt-0 space-y-4 border-t mt-2">
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Inferred Audience</p>
                          <p className="text-sm"><strong>Primary ICP:</strong> {ad.inferredAudience.primaryICP}</p>
                          <p className="text-sm"><strong>Company Size:</strong> {ad.inferredAudience.companySize}</p>
                          {ad.inferredAudience.businessType.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ad.inferredAudience.businessType.map((bt, j) => (
                                <Badge key={j} variant="outline" className="text-xs">{bt}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Messaging Analysis</p>
                          <p className="text-sm"><strong>Angle:</strong> {ad.messagingAnalysis.primaryAngle}</p>
                          <p className="text-sm"><strong>Value Prop:</strong> {ad.messagingAnalysis.valueProposition}</p>
                        </div>
                      </div>
                      
                      {ad.painPointsAddressed.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Pain Points Addressed</p>
                          <div className="flex flex-wrap gap-1">
                            {ad.painPointsAddressed.map((pp, j) => (
                              <Badge key={j} variant="secondary" className="text-xs">{pp}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {ad.copywritingInsights && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Copywriting Insights
                          </p>
                          <p className="text-sm"><strong>Hook Style:</strong> {ad.copywritingInsights.hookStyle}</p>
                          <p className="text-sm"><strong>Tone:</strong> {ad.copywritingInsights.toneOfVoice}</p>
                          {ad.copywritingInsights.persuasionTechniques.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ad.copywritingInsights.persuasionTechniques.map((tech, j) => (
                                <Badge key={j} variant="outline" className="text-xs">{tech}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground italic">
                        {ad.relevanceReasoning}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
              
              {results.results.ads.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No ads found. Try adjusting your search criteria.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Reddit Tab */}
          <TabsContent value="reddit" className="space-y-4">
            {results.redditInsights ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Reddit Mentions Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{results.redditInsights.totalMentions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Top Subreddits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {results.redditInsights.topSubreddits.map((sr, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                          <span>r/{sr.subreddit}</span>
                          <Badge variant="secondary">{sr.count}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No Reddit insights collected for this discovery run.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State */}
      {!results && !isLoading && !error && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="p-4 rounded-full bg-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium text-lg">Ready to Discover Your ICP?</p>
                <p className="text-sm text-muted-foreground max-w-md mt-1">
                  Click &quot;Run Discovery&quot; to search for ads targeting businesses that need copywriting services. 
                  We&apos;ll analyze the ads with AI to infer targeting and identify opportunities.
                </p>
              </div>
              <Button onClick={runDiscovery} className="gap-2">
                <Search className="h-4 w-4" />
                Run Discovery
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

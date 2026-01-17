"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockGapOpportunities, mockClusters, mockAdCreatives, mockRedditMentions } from "@/lib/mock-data";
import { Target, MessageSquare, ShoppingBag, Lightbulb, ArrowRight, Quote, ExternalLink } from "lucide-react";

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

export default function GapsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gap Opportunities</h1>
        <p className="text-muted-foreground">
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

      <Tabs defaultValue="gaps" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gaps">Gap Opportunities</TabsTrigger>
          <TabsTrigger value="objections">User Objections</TabsTrigger>
          <TabsTrigger value="angles">Ad Angles</TabsTrigger>
        </TabsList>

        <TabsContent value="gaps" className="space-y-4">
          {mockGapOpportunities.map((gap, index) => (
            <Card key={gap.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{gap.title}</CardTitle>
                        {getGapTypeBadge(gap.gapType)}
                      </div>
                      <CardDescription className="max-w-2xl">
                        {gap.problem}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{gap.opportunityScore}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(gap.confidence * 100)}% confidence
                    </p>
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
          ))}
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
                    <div key={cluster.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{cluster.label}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Frequency: {cluster.frequency}</span>
                          <span>Intensity: {Math.round(cluster.intensity * 100)}%</span>
                        </div>
                      </div>
                      <Progress value={cluster.intensity * 100} className="h-2" />
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
              <CardTitle>Raw Reddit Mentions</CardTitle>
              <CardDescription>
                Source data from user discussions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {mockRedditMentions.map((mention) => (
                    <div key={mention.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{mention.subreddit}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {mention.score} points
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`https://reddit.com${mention.permalink}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                      {mention.title && (
                        <h4 className="font-medium">{mention.title}</h4>
                      )}
                      <p className="text-sm text-muted-foreground">{mention.text}</p>
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

"use client";

import { useState } from "react";
import { getDemoNiches, DemoNiche } from "@/lib/demo/niches";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Users, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  const [selectedNiche, setSelectedNiche] = useState<DemoNiche | null>(null);
  const demoNiches = getDemoNiches();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">GapRadar</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Explore Market Opportunities
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            See real examples of market gap analysis. Click any niche below to see
            instant insights backed by ad data and Reddit discussions.
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Create Your Own Analysis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Demo Niches Grid */}
        {!selectedNiche && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {demoNiches.map((niche) => (
              <Card
                key={niche.id}
                data-testid="demo-niche-card"
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedNiche(niche)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" data-testid="niche-category">
                      {niche.category}
                    </Badge>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold text-primary" data-testid="opportunity-score">
                        {niche.opportunityScore}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Opportunity
                      </span>
                    </div>
                  </div>
                  <CardTitle data-testid="niche-name">{niche.name}</CardTitle>
                  <CardDescription>{niche.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {niche.preview.marketSnapshot.totalAds} ads
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {niche.preview.marketSnapshot.totalMentions} mentions
                    </div>
                  </div>
                  <Button variant="ghost" className="w-full mt-4 gap-2">
                    View Insights <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Demo Preview */}
        {selectedNiche && (
          <div data-testid="demo-preview" className="space-y-6">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => setSelectedNiche(null)}
              className="mb-4"
            >
              ← Back to all demos
            </Button>

            {/* Preview Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {selectedNiche.category}
                  </Badge>
                  <h2 className="text-3xl font-bold mb-2">{selectedNiche.name}</h2>
                  <p className="text-lg text-muted-foreground">
                    {selectedNiche.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary">
                    {selectedNiche.opportunityScore}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Opportunity Score
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round(selectedNiche.confidence * 100)}% confidence
                  </div>
                </div>
              </div>
            </div>

            {/* Market Snapshot */}
            <Card>
              <CardHeader>
                <CardTitle>Market Snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold">
                      {selectedNiche.preview.marketSnapshot.totalAds}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Ads</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold">
                      {selectedNiche.preview.marketSnapshot.uniqueAdvertisers}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Advertisers
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold">
                      {selectedNiche.preview.marketSnapshot.totalMentions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reddit Mentions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Gaps */}
            <Card>
              <CardHeader>
                <CardTitle>Top Market Gaps</CardTitle>
                <CardDescription>
                  Key opportunities where demand exists but current solutions fall
                  short
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedNiche.preview.topGaps.map((gap, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-semibold">{gap.title}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {gap.type} gap
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {gap.score}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {selectedNiche.preview.topInsights.map((insight, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-primary">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Platform Recommendation */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {selectedNiche.preview.platformRecommendation.toUpperCase()}
                  </Badge>
                  <span className="text-muted-foreground">
                    Best platform for this opportunity
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* CTA to Full Report */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2">
                  Want the Full Analysis?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Get detailed competitor analysis, complete gap opportunities, UGC
                  recommendations, economic models, and a 30-day action plan.
                </p>
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Create Full Report <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom CTA */}
        {!selectedNiche && (
          <div className="text-center mt-12 p-8 bg-muted rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Ready to Find Your Market Gap?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Sign up now to analyze any niche with real ad data, Reddit insights, and
              AI-powered gap detection.
            </p>
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

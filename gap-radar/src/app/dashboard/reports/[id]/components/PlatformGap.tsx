"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Globe, ShoppingCart, Users, TrendingUp, AlertTriangle } from "lucide-react";

interface PlatformGapProps {
  gaps: {
    id: string;
    type: string;
    title: string;
    problem: string;
    recommendation: string;
    score: number;
    confidence: number;
  }[];
  summary: {
    totalAds: number;
    totalMentions: number;
  };
}

interface PlatformData {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  coverage: number;
  adCount: number;
  gaps: number;
  status: "strong" | "moderate" | "weak" | "missing";
}

function PlatformCard({ platform }: { platform: PlatformData }) {
  const statusColors = {
    strong: "bg-green-50 border-green-200",
    moderate: "bg-blue-50 border-blue-200",
    weak: "bg-orange-50 border-orange-200",
    missing: "bg-red-50 border-red-200",
  };

  const statusBadges = {
    strong: <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Strong Presence</Badge>,
    moderate: <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Moderate Presence</Badge>,
    weak: <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">Weak Presence</Badge>,
    missing: <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Opportunity Gap</Badge>,
  };

  const Icon = platform.icon;

  return (
    <div className={`p-4 rounded-lg border-2 ${statusColors[platform.status]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/80">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold">{platform.name}</h4>
            <p className="text-xs text-muted-foreground">{platform.adCount} ads found</p>
          </div>
        </div>
        {statusBadges[platform.status]}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Market Coverage</span>
          <span className="font-medium">{platform.coverage}%</span>
        </div>
        <Progress value={platform.coverage} className="h-2" />

        {platform.gaps > 0 && (
          <div className="flex items-center gap-2 text-xs text-orange-600 mt-2">
            <AlertTriangle className="h-3 w-3" />
            <span>{platform.gaps} gap opportunities identified</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlatformGap({ gaps, summary }: PlatformGapProps) {
  // Analyze gaps to determine platform coverage
  // In a real implementation, this would analyze the actual ad data
  // For now, we'll simulate based on gap types
  const platforms: PlatformData[] = [
    {
      name: "Meta (Facebook/Instagram)",
      icon: Globe,
      coverage: 85,
      adCount: Math.floor(summary.totalAds * 0.85),
      gaps: gaps.filter(g => g.type === "positioning" || g.type === "offer").length,
      status: "strong",
    },
    {
      name: "Google Ads",
      icon: Globe,
      coverage: 45,
      adCount: Math.floor(summary.totalAds * 0.45),
      gaps: gaps.filter(g => g.type === "product").length,
      status: "moderate",
    },
    {
      name: "TikTok",
      icon: Users,
      coverage: 20,
      adCount: Math.floor(summary.totalAds * 0.2),
      gaps: gaps.filter(g => g.type === "trust").length,
      status: "weak",
    },
    {
      name: "Pinterest",
      icon: ShoppingCart,
      coverage: 5,
      adCount: Math.floor(summary.totalAds * 0.05),
      gaps: gaps.filter(g => g.type === "pricing").length,
      status: "missing",
    },
  ];

  const platformGaps = gaps.filter(g =>
    g.problem.toLowerCase().includes("platform") ||
    g.recommendation.toLowerCase().includes("platform") ||
    g.title.toLowerCase().includes("platform")
  );

  const topPlatformGap = platformGaps[0];

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Distribution Analysis</CardTitle>
          <CardDescription>
            Understanding where competitors are advertising and identifying untapped platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {platforms.map((platform) => (
              <PlatformCard key={platform.name} platform={platform} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insight */}
      {topPlatformGap && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Top Platform Opportunity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">{topPlatformGap.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{topPlatformGap.problem}</p>
              </div>
              <div className="p-4 bg-background rounded-lg border">
                <p className="text-sm font-medium mb-2">Recommendation:</p>
                <p className="text-sm text-muted-foreground">{topPlatformGap.recommendation}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Opportunity Score:</span>
                  <div className="flex items-center gap-1">
                    <Progress value={topPlatformGap.score} className="w-16 h-2" />
                    <span className="text-sm font-medium">{topPlatformGap.score}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <span className="text-sm font-medium">
                    {Math.round(topPlatformGap.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Strategy Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Strategy Insights</CardTitle>
          <CardDescription>
            Recommendations for platform diversification and opportunity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platforms.map((platform) => {
              let insight = "";
              let recommendation = "";

              switch (platform.status) {
                case "strong":
                  insight = `${platform.name} has strong market presence with ${platform.coverage}% coverage.`;
                  recommendation = "Monitor competitive activity and maintain presence with differentiated messaging.";
                  break;
                case "moderate":
                  insight = `${platform.name} shows moderate activity with ${platform.coverage}% coverage.`;
                  recommendation = "Consider increasing investment if target audience aligns with platform demographics.";
                  break;
                case "weak":
                  insight = `${platform.name} has limited presence with only ${platform.coverage}% coverage.`;
                  recommendation = "Significant opportunity to establish early presence before market saturates.";
                  break;
                case "missing":
                  insight = `${platform.name} is virtually untapped with just ${platform.coverage}% coverage.`;
                  recommendation = "High-opportunity platform with minimal competition. Consider first-mover advantage.";
                  break;
              }

              return (
                <div key={platform.name} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-muted">
                      <platform.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{platform.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{insight}</p>
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-primary shrink-0">→</span>
                        <p className="text-muted-foreground">{recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All Platform-Related Gaps */}
      {platformGaps.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Platform-Specific Gap Opportunities</CardTitle>
            <CardDescription>
              Additional opportunities identified across different platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {platformGaps.slice(1).map((gap, index) => (
                <div
                  key={gap.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                    {index + 2}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{gap.title}</h4>
                      <Badge variant="outline">{gap.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{gap.problem}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Score:</span>
                        <span className="text-sm font-medium">{gap.score}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <span className="text-sm font-medium">
                          {Math.round(gap.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Saturation by Platform */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Platform Saturation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                {platforms.filter(p => p.status === "strong").length} platform(s) show strong competitive presence, indicating validated market channels.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                {platforms.filter(p => p.status === "weak" || p.status === "missing").length} platform(s) represent high-opportunity channels with limited competition.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Consider testing underutilized platforms to establish early presence before market saturation increases.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

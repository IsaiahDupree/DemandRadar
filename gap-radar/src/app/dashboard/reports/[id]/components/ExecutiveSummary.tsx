"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

interface ExecutiveSummaryProps {
  scores: {
    saturation: number;
    longevity: number;
    dissatisfaction: number;
    misalignment: number;
    opportunity: number;
    confidence: number;
  };
  summary: {
    totalAds: number;
    totalMentions: number;
    totalGaps: number;
    totalConcepts: number;
    uniqueAdvertisers: number;
    topObjections: number;
  };
  gaps: {
    id: string;
    type: string;
    title: string;
    problem: string;
    recommendation: string;
    score: number;
    confidence: number;
  }[];
  nicheQuery: string;
}

function ScoreCard({
  label,
  value,
  description,
  color = "blue"
}: {
  label: string;
  value: number;
  description: string;
  color?: "blue" | "green" | "orange" | "red";
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
  };

  const progressColor = {
    blue: "",
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <div className={`px-2 py-1 rounded text-sm font-bold ${colorClasses[color]}`}>
          {value}
        </div>
      </div>
      <Progress value={value} className={`h-2 ${progressColor[color]}`} />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function getGapTypeColor(type: string): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "product":
      return "destructive";
    case "offer":
      return "secondary";
    case "positioning":
      return "outline";
    case "trust":
      return "default";
    case "pricing":
      return "secondary";
    default:
      return "outline";
  }
}

export function ExecutiveSummary({ scores, summary, gaps, nicheQuery }: ExecutiveSummaryProps) {
  const topGaps = gaps.slice(0, 3);

  // Determine primary recommendation based on scores
  const getPrimaryRecommendation = () => {
    if (scores.opportunity >= 70 && scores.confidence >= 0.7) {
      return {
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-50",
        title: "Strong Opportunity",
        message: `The "${nicheQuery}" market shows strong potential with high opportunity score and confidence. Consider pursuing this niche.`,
      };
    } else if (scores.opportunity >= 50) {
      return {
        icon: TrendingUp,
        color: "text-blue-600",
        bg: "bg-blue-50",
        title: "Moderate Opportunity",
        message: `The "${nicheQuery}" market has moderate potential. Review the gap opportunities below for specific angles to pursue.`,
      };
    } else if (scores.saturation >= 70) {
      return {
        icon: AlertCircle,
        color: "text-orange-600",
        bg: "bg-orange-50",
        title: "Saturated Market",
        message: `The "${nicheQuery}" market is highly saturated. Consider niche-down strategies or unique positioning to stand out.`,
      };
    } else {
      return {
        icon: TrendingDown,
        color: "text-red-600",
        bg: "bg-red-50",
        title: "Limited Opportunity",
        message: `The "${nicheQuery}" market shows limited opportunity based on current data. Consider exploring alternative niches.`,
      };
    }
  };

  const recommendation = getPrimaryRecommendation();
  const RecommendationIcon = recommendation.icon;

  return (
    <div className="space-y-6">
      {/* Primary Recommendation */}
      <Card className={`border-2 ${recommendation.bg}`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${recommendation.bg}`}>
              <RecommendationIcon className={`h-6 w-6 ${recommendation.color}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${recommendation.color}`}>
                {recommendation.title}
              </h3>
              <p className="text-sm text-muted-foreground">{recommendation.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Market Analysis Scores</CardTitle>
          <CardDescription>
            Comprehensive scoring across six key dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ScoreCard
              label="Opportunity Score"
              value={scores.opportunity}
              description="Overall market opportunity based on all factors"
              color={scores.opportunity >= 70 ? "green" : scores.opportunity >= 50 ? "blue" : "orange"}
            />
            <ScoreCard
              label="Market Saturation"
              value={scores.saturation}
              description={`${summary.uniqueAdvertisers} advertisers running ${summary.totalAds} ads`}
              color={scores.saturation >= 70 ? "red" : scores.saturation >= 50 ? "orange" : "green"}
            />
            <ScoreCard
              label="Ad Longevity"
              value={scores.longevity}
              description="How long ads have been running in this market"
              color={scores.longevity >= 70 ? "green" : scores.longevity >= 50 ? "blue" : "orange"}
            />
            <ScoreCard
              label="User Dissatisfaction"
              value={scores.dissatisfaction}
              description={`Analyzed from ${summary.totalMentions} Reddit mentions`}
              color={scores.dissatisfaction >= 70 ? "green" : scores.dissatisfaction >= 50 ? "blue" : "orange"}
            />
            <ScoreCard
              label="Solution Misalignment"
              value={scores.misalignment}
              description="Gap between user needs and current solutions"
              color={scores.misalignment >= 70 ? "green" : scores.misalignment >= 50 ? "blue" : "orange"}
            />
            <ScoreCard
              label="Confidence Level"
              value={Math.round(scores.confidence * 100)}
              description="Data quality and analysis certainty"
              color={scores.confidence >= 0.7 ? "green" : scores.confidence >= 0.5 ? "blue" : "orange"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Gap Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Top 3 Gap Opportunities</CardTitle>
          <CardDescription>
            The highest-scoring market gaps identified in this analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topGaps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No gap opportunities identified in this analysis
            </p>
          ) : (
            <div className="space-y-4">
              {topGaps.map((gap, index) => (
                <div
                  key={gap.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{gap.title}</h4>
                      <Badge variant={getGapTypeColor(gap.type)}>
                        {gap.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{gap.problem}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Score:</span>
                        <div className="flex items-center gap-1">
                          <Progress value={gap.score} className="w-16 h-2" />
                          <span className="text-sm font-medium">{gap.score}</span>
                        </div>
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
          )}
        </CardContent>
      </Card>

      {/* Data Collection Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Collection Summary</CardTitle>
          <CardDescription>
            Overview of data sources analyzed for this report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Ads Analyzed</p>
              <p className="text-2xl font-bold">{summary.totalAds}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Reddit Mentions</p>
              <p className="text-2xl font-bold">{summary.totalMentions}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Gap Opportunities</p>
              <p className="text-2xl font-bold">{summary.totalGaps}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Concept Ideas</p>
              <p className="text-2xl font-bold">{summary.totalConcepts}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

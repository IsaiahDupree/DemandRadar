"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, AlertCircle, CheckCircle, Package, DollarSign, MessageSquare, Shield, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface GapOpportunitiesProps {
  gaps: {
    id: string;
    type: string;
    title: string;
    problem: string;
    recommendation: string;
    score: number;
    confidence: number;
  }[];
}

function getGapTypeIcon(type: string) {
  switch (type) {
    case "product":
      return Package;
    case "offer":
      return DollarSign;
    case "positioning":
      return MessageSquare;
    case "trust":
      return Shield;
    case "pricing":
      return DollarSign;
    default:
      return Layers;
  }
}

function getGapTypeColor(type: string): string {
  switch (type) {
    case "product":
      return "text-purple-600 bg-purple-50 border-purple-200";
    case "offer":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "positioning":
      return "text-green-600 bg-green-50 border-green-200";
    case "trust":
      return "text-red-600 bg-red-50 border-red-200";
    case "pricing":
      return "text-orange-600 bg-orange-50 border-orange-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

function getGapTypeBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
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

function getScoreBadge(score: number) {
  if (score >= 80) {
    return { label: "High Priority", color: "bg-red-500/10 text-red-600" };
  } else if (score >= 60) {
    return { label: "Medium Priority", color: "bg-orange-500/10 text-orange-600" };
  } else {
    return { label: "Low Priority", color: "bg-blue-500/10 text-blue-600" };
  }
}

function GapCard({ gap, rank }: { gap: GapOpportunitiesProps["gaps"][0]; rank: number }) {
  const colorClass = getGapTypeColor(gap.type);
  const scoreBadge = getScoreBadge(gap.score);
  const iconType = gap.type;

  return (
    <Card className={cn("border-2 hover:shadow-md transition-all", colorClass)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold shrink-0">
              {rank}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {iconType === "product" && <Package className="h-5 w-5" />}
                {iconType === "offer" && <DollarSign className="h-5 w-5" />}
                {iconType === "positioning" && <MessageSquare className="h-5 w-5" />}
                {iconType === "trust" && <Shield className="h-5 w-5" />}
                {iconType === "pricing" && <DollarSign className="h-5 w-5" />}
                {!["product", "offer", "positioning", "trust", "pricing"].includes(iconType) && <Layers className="h-5 w-5" />}
                <h3 className="font-semibold text-lg">{gap.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getGapTypeBadgeVariant(gap.type)}>
                  {gap.type}
                </Badge>
                <Badge className={scoreBadge.color}>
                  {scoreBadge.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Problem Identified
          </h4>
          <p className="text-sm text-muted-foreground pl-6">{gap.problem}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Recommendation
          </h4>
          <p className="text-sm text-muted-foreground pl-6">{gap.recommendation}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Opportunity Score</p>
            <div className="flex items-center gap-2">
              <Progress value={gap.score} className="h-2 flex-1" />
              <span className="text-sm font-bold">{gap.score}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Confidence Level</p>
            <div className="flex items-center gap-2">
              <Progress value={gap.confidence * 100} className="h-2 flex-1" />
              <span className="text-sm font-bold">{Math.round(gap.confidence * 100)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GapOpportunities({ gaps }: GapOpportunitiesProps) {
  // Group gaps by type
  const gapsByType = gaps.reduce((acc, gap) => {
    if (!acc[gap.type]) {
      acc[gap.type] = [];
    }
    acc[gap.type].push(gap);
    return acc;
  }, {} as Record<string, typeof gaps>);

  // Sort each group by score
  Object.keys(gapsByType).forEach(type => {
    gapsByType[type].sort((a, b) => b.score - a.score);
  });

  const allGapsSorted = [...gaps].sort((a, b) => b.score - a.score);
  const highPriorityGaps = allGapsSorted.filter(g => g.score >= 80);
  const mediumPriorityGaps = allGapsSorted.filter(g => g.score >= 60 && g.score < 80);
  const lowPriorityGaps = allGapsSorted.filter(g => g.score < 60);

  const avgScore = gaps.length > 0
    ? Math.round(gaps.reduce((sum, g) => sum + g.score, 0) / gaps.length)
    : 0;

  const avgConfidence = gaps.length > 0
    ? Math.round(gaps.reduce((sum, g) => sum + g.confidence, 0) / gaps.length * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gaps.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Opportunities identified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highPriorityGaps.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Score ≥ 80
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all gaps
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConfidence}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Data reliability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Detailed Gap Analysis</CardTitle>
          </div>
          <CardDescription>
            Explore all identified opportunities, filtered by category or priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
              <TabsTrigger value="all">All ({gaps.length})</TabsTrigger>
              <TabsTrigger value="high">High ({highPriorityGaps.length})</TabsTrigger>
              <TabsTrigger value="medium">Medium ({mediumPriorityGaps.length})</TabsTrigger>
              <TabsTrigger value="product">Product ({gapsByType.product?.length || 0})</TabsTrigger>
              <TabsTrigger value="offer">Offer ({gapsByType.offer?.length || 0})</TabsTrigger>
              <TabsTrigger value="positioning">Positioning ({gapsByType.positioning?.length || 0})</TabsTrigger>
              <TabsTrigger value="trust">Trust ({gapsByType.trust?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {allGapsSorted.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No gaps identified</p>
              ) : (
                allGapsSorted.map((gap, index) => (
                  <GapCard key={gap.id} gap={gap} rank={index + 1} />
                ))
              )}
            </TabsContent>

            <TabsContent value="high" className="space-y-4">
              {highPriorityGaps.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No high priority gaps</p>
              ) : (
                highPriorityGaps.map((gap, index) => (
                  <GapCard key={gap.id} gap={gap} rank={index + 1} />
                ))
              )}
            </TabsContent>

            <TabsContent value="medium" className="space-y-4">
              {mediumPriorityGaps.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No medium priority gaps</p>
              ) : (
                mediumPriorityGaps.map((gap, index) => (
                  <GapCard key={gap.id} gap={gap} rank={index + 1} />
                ))
              )}
            </TabsContent>

            {Object.keys(gapsByType).map(type => (
              <TabsContent key={type} value={type} className="space-y-4">
                {gapsByType[type].length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No {type} gaps</p>
                ) : (
                  gapsByType[type].map((gap, index) => (
                    <GapCard key={gap.id} gap={gap} rank={index + 1} />
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Gap Analysis Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {highPriorityGaps.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  {highPriorityGaps.length} high-priority gap{highPriorityGaps.length > 1 ? "s" : ""} identified with score ≥ 80, representing immediate market opportunities.
                </span>
              </li>
            )}
            {Object.keys(gapsByType).length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Gaps span {Object.keys(gapsByType).length} categories: {Object.keys(gapsByType).join(", ")}, indicating diverse opportunity vectors.
                </span>
              </li>
            )}
            {avgConfidence >= 70 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Average confidence of {avgConfidence}% indicates strong data reliability for these gap recommendations.
                </span>
              </li>
            )}
            {allGapsSorted.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Top opportunity: &quot;{allGapsSorted[0].title}&quot; with score of {allGapsSorted[0].score}, focusing on {allGapsSorted[0].type}.
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

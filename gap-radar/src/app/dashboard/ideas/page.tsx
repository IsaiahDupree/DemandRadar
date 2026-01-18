"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { mockConceptIdeas, mockAppStoreResults } from "@/lib/mock-data";
import { 
  Lightbulb, 
  Globe, 
  Smartphone, 
  MonitorSmartphone,
  DollarSign,
  TrendingUp,
  Wrench,
  Users,
  Bot,
  Target,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  BarChart3
} from "lucide-react";

function getPlatformIcon(platform: string) {
  switch (platform) {
    case "web":
      return <Globe className="h-4 w-4" />;
    case "mobile":
      return <Smartphone className="h-4 w-4" />;
    case "hybrid":
      return <MonitorSmartphone className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
}

function getPlatformBadge(platform: string) {
  const colors: Record<string, string> = {
    web: "bg-blue-500/10 text-blue-600",
    mobile: "bg-green-500/10 text-green-600",
    hybrid: "bg-purple-500/10 text-purple-600",
  };
  return (
    <Badge className={`${colors[platform] || "bg-gray-500/10 text-gray-600"} border-0 gap-1`}>
      {getPlatformIcon(platform)}
      {platform}
    </Badge>
  );
}

function getBusinessModelBadge(model: string) {
  const colors: Record<string, string> = {
    b2c: "bg-orange-500/10 text-orange-600",
    b2b: "bg-indigo-500/10 text-indigo-600",
    b2b2c: "bg-pink-500/10 text-pink-600",
  };
  return (
    <Badge className={`${colors[model] || "bg-gray-500/10 text-gray-600"} border-0`}>
      {model.toUpperCase()}
    </Badge>
  );
}

function getTouchLevelBadge(level: string) {
  const colors: Record<string, string> = {
    low: "bg-green-500/10 text-green-600",
    medium: "bg-yellow-500/10 text-yellow-600",
    high: "bg-red-500/10 text-red-600",
  };
  return (
    <Badge className={`${colors[level] || "bg-gray-500/10 text-gray-600"} border-0`}>
      {level}
    </Badge>
  );
}

function formatCurrency(value: number) {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export default function IdeasPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Product Ideas</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Vetted product concepts with market validation and build estimates
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockConceptIdeas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockConceptIdeas.filter((c) => c.metrics?.opportunityScore && c.metrics.opportunityScore > 75).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Web Recommended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockConceptIdeas.filter((c) => c.platformRecommendation === "web").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Touch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockConceptIdeas.filter((c) => c.metrics?.humanTouchLevel === "low").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cards" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cards" className="text-xs sm:text-sm">Idea Cards</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs sm:text-sm">Comparison</TabsTrigger>
          <TabsTrigger value="platforms" className="text-xs sm:text-sm">Platform Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-6">
          {mockConceptIdeas.map((idea, index) => (
            <Card key={idea.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg leading-tight mb-2">{idea.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {idea.oneLiner}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pl-11">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getPlatformBadge(idea.platformRecommendation)}
                      {getBusinessModelBadge(idea.businessModel)}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {idea.metrics?.opportunityScore}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-11 w-fit text-xs">{idea.industry}</Badge>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <CardTitle className="text-xl">{idea.name}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {idea.oneLiner}
                    </CardDescription>
                    <div className="flex items-center gap-2 pt-1">
                      {getPlatformBadge(idea.platformRecommendation)}
                      {getBusinessModelBadge(idea.businessModel)}
                      <Badge variant="outline">{idea.industry}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">
                      {idea.metrics?.opportunityScore}
                    </div>
                    <p className="text-sm text-muted-foreground">Opportunity Score</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-6">
                {/* Gap Thesis */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                    <Target className="h-4 w-4" />
                    Gap Thesis
                  </div>
                  <p className="text-sm">{idea.gapThesis}</p>
                </div>

                {/* Platform Reasoning */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Platform Recommendation</h4>
                  <p className="text-sm text-muted-foreground">{idea.platformReasoning}</p>
                </div>

                {/* Metrics Grid */}
                {idea.metrics && (
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Economics */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        Economics (Estimated)
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CPC</span>
                          <span>{formatCurrency(idea.metrics.cpcLow)} - {formatCurrency(idea.metrics.cpcHigh)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CAC</span>
                          <span>{formatCurrency(idea.metrics.cacLow)} - {formatCurrency(idea.metrics.cacHigh)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">TAM</span>
                          <span>{formatCurrency(idea.metrics.tamLow)} - {formatCurrency(idea.metrics.tamHigh)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Buildability */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        Buildability
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Build Difficulty</span>
                            <span>{idea.metrics.buildDifficulty}/100</span>
                          </div>
                          <Progress value={idea.metrics.buildDifficulty} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Distribution</span>
                            <span>{idea.metrics.distributionDifficulty}/100</span>
                          </div>
                          <Progress value={idea.metrics.distributionDifficulty} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Touch Level */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        Automation Fit
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Human Touch</span>
                          {getTouchLevelBadge(idea.metrics.humanTouchLevel)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Agent Suitability</span>
                          {getTouchLevelBadge(idea.metrics.autonomousSuitability)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confidence</span>
                          <span>{Math.round(idea.metrics.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* MVP Spec */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      MVP Must-Haves
                    </h4>
                    <ul className="space-y-2">
                      {idea.mvpSpec.mustHaves.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      Non-Goals (Skip for MVP)
                    </h4>
                    <ul className="space-y-2">
                      {idea.mvpSpec.nonGoals.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Success Criteria */}
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Success Criteria
                  </h4>
                  <div className="grid gap-2 md:grid-cols-3">
                    {idea.mvpSpec.successCriteria.map((criteria, i) => (
                      <div key={i} className="text-sm p-2 bg-background rounded border">
                        {criteria}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Full Report
                  </Button>
                  <Button>
                    Start Building
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Idea Comparison</CardTitle>
              <CardDescription>Side-by-side metrics comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Idea</th>
                      <th className="text-center py-3 px-2 font-medium">Platform</th>
                      <th className="text-center py-3 px-2 font-medium">Model</th>
                      <th className="text-center py-3 px-2 font-medium">Opportunity</th>
                      <th className="text-center py-3 px-2 font-medium">CAC</th>
                      <th className="text-center py-3 px-2 font-medium">Build</th>
                      <th className="text-center py-3 px-2 font-medium">Touch</th>
                      <th className="text-center py-3 px-2 font-medium">Agent Fit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockConceptIdeas.map((idea) => (
                      <tr key={idea.id} className="border-b">
                        <td className="py-3 px-2 font-medium">{idea.name}</td>
                        <td className="py-3 px-2 text-center">{getPlatformBadge(idea.platformRecommendation)}</td>
                        <td className="py-3 px-2 text-center">{getBusinessModelBadge(idea.businessModel)}</td>
                        <td className="py-3 px-2 text-center font-bold">{idea.metrics?.opportunityScore}</td>
                        <td className="py-3 px-2 text-center">{formatCurrency(idea.metrics?.cacExpected || 0)}</td>
                        <td className="py-3 px-2 text-center">{idea.metrics?.buildDifficulty}/100</td>
                        <td className="py-3 px-2 text-center">{getTouchLevelBadge(idea.metrics?.humanTouchLevel || "medium")}</td>
                        <td className="py-3 px-2 text-center">{getTouchLevelBadge(idea.metrics?.autonomousSuitability || "medium")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Presence Analysis</CardTitle>
              <CardDescription>
                Market saturation across iOS, Android, and Web
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {["ios", "android", "web"].map((platform) => {
                  const apps = mockAppStoreResults.filter((a) => a.platform === platform);
                  const avgRating = apps.length > 0 
                    ? apps.reduce((a, b) => a + b.rating, 0) / apps.length 
                    : 0;
                  
                  return (
                    <div key={platform} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        {platform === "ios" && <Smartphone className="h-5 w-5" />}
                        {platform === "android" && <MonitorSmartphone className="h-5 w-5" />}
                        {platform === "web" && <Globe className="h-5 w-5" />}
                        <h4 className="font-semibold capitalize">{platform}</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Apps Found</span>
                          <span className="font-medium">{apps.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Rating</span>
                          <span className="font-medium">{avgRating.toFixed(1)}</span>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          {apps.slice(0, 2).map((app) => (
                            <div key={app.id} className="text-sm p-2 bg-muted/50 rounded">
                              <div className="font-medium truncate">{app.appName}</div>
                              <div className="text-xs text-muted-foreground">
                                {app.rating} ★ • {app.reviewCount.toLocaleString()} reviews
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

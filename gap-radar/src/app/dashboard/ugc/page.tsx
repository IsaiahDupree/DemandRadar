"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { mockUGCAssets, mockUGCRecommendations } from "@/lib/mock-data";
import { 
  Video, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2,
  Copy,
  Play,
  Clock,
  Sparkles,
  Target,
  FileText,
  Camera
} from "lucide-react";
import { toast } from "sonner";

function formatNumber(num: number) {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function getSourceBadge(source: string) {
  const colors: Record<string, string> = {
    tiktok_top_ads: "bg-pink-500/10 text-pink-600",
    tiktok_commercial: "bg-purple-500/10 text-purple-600",
    tiktok_trend: "bg-blue-500/10 text-blue-600",
    ig_hashtag: "bg-orange-500/10 text-orange-600",
    tiktok_connected: "bg-green-500/10 text-green-600",
    ig_connected: "bg-yellow-500/10 text-yellow-600",
  };
  const labels: Record<string, string> = {
    tiktok_top_ads: "Top Ad",
    tiktok_commercial: "Commercial",
    tiktok_trend: "Trending",
    ig_hashtag: "IG Hashtag",
    tiktok_connected: "Your TikTok",
    ig_connected: "Your IG",
  };
  return (
    <Badge className={`${colors[source] || "bg-gray-500/10 text-gray-600"} border-0`}>
      {labels[source] || source}
    </Badge>
  );
}

function getPriorityBadge(priority: string) {
  const colors: Record<string, string> = {
    high: "bg-red-500/10 text-red-600",
    medium: "bg-yellow-500/10 text-yellow-600",
    low: "bg-green-500/10 text-green-600",
  };
  return (
    <Badge className={`${colors[priority] || "bg-gray-500/10 text-gray-600"} border-0`}>
      {priority}
    </Badge>
  );
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}

export default function UGCPage() {
  const recommendations = mockUGCRecommendations;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">UGC Winners</h1>
        <p className="text-muted-foreground">
          Top performing content and ready-to-use scripts for your niche
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">UGC Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUGCAssets.length}</div>
            <p className="text-xs text-muted-foreground">From TikTok & Instagram</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockUGCAssets.filter((a) => a.source === "tiktok_top_ads").length}
            </div>
            <p className="text-xs text-muted-foreground">Highest performers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ready Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.scripts.length}</div>
            <p className="text-xs text-muted-foreground">Film-ready outlines</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hook Bank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.hooks.length}</div>
            <p className="text-xs text-muted-foreground">Tested openers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="hooks">Hook Bank</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="shotlist">Shot List</TabsTrigger>
          <TabsTrigger value="angles">Angle Map</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing UGC</CardTitle>
              <CardDescription>
                Ranked by engagement score across TikTok ads and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUGCAssets
                  .sort((a, b) => (b.metrics?.score || 0) - (a.metrics?.score || 0))
                  .map((asset, index) => (
                    <div key={asset.id} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Play className="h-8 w-8 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getSourceBadge(asset.source)}
                              <Badge variant="outline" className="gap-1">
                                <Video className="h-3 w-3" />
                                {asset.platform}
                              </Badge>
                            </div>
                            <p className="text-sm">{asset.caption}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {asset.metrics?.score}
                            </div>
                            <p className="text-xs text-muted-foreground">Score</p>
                          </div>
                        </div>
                        
                        {asset.metrics && (
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {formatNumber(asset.metrics.views)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {formatNumber(asset.metrics.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-4 w-4" />
                              {formatNumber(asset.metrics.comments)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="h-4 w-4" />
                              {formatNumber(asset.metrics.shares)}
                            </span>
                          </div>
                        )}
                        
                        {asset.patterns && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Badge variant="secondary" className="text-xs">
                              Hook: {asset.patterns.hookType}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Format: {asset.patterns.format}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Proof: {asset.patterns.proofType}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              CTA: {asset.patterns.ctaStyle}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Hook Bank
              </CardTitle>
              <CardDescription>
                {recommendations.hooks.length} tested hooks based on top performing content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {recommendations.hooks.map((hook, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">&ldquo;{hook.text}&rdquo;</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="shrink-0"
                        onClick={() => copyToClipboard(hook.text)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {hook.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ready-to-Film Scripts
              </CardTitle>
              <CardDescription>
                Script outlines optimized for different video lengths
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recommendations.scripts.map((script, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-0">
                          <Clock className="h-3 w-3 mr-1" />
                          {script.duration}
                        </Badge>
                        <span className="text-sm font-medium">Script {index + 1}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(script.outline.join('\n'))}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Script
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {script.outline.map((line, lineIndex) => (
                        <div key={lineIndex} className="flex gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                            {lineIndex + 1}
                          </div>
                          <p className="pt-0.5">{line}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shotlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Shot List
              </CardTitle>
              <CardDescription>
                What to film for maximum impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.shotList.map((shot, index) => (
                  <div key={index} className="flex gap-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{shot.shot}</p>
                      <p className="text-sm text-muted-foreground">{shot.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="angles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Angle Priority Map
              </CardTitle>
              <CardDescription>
                Which messaging angles to test first based on market data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.angleMap.map((angle, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{angle.angle}</h4>
                      {getPriorityBadge(angle.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground">{angle.reasoning}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Test Priority:</span>
                      <Progress 
                        value={angle.priority === "high" ? 90 : angle.priority === "medium" ? 50 : 20} 
                        className="w-24 h-2" 
                      />
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

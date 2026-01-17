"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Minus, Hash, Music, Users, Sparkles } from "lucide-react";

const trendData = [
  { month: "Aug", saturation: 45, interest: 62, ads: 34 },
  { month: "Sep", saturation: 48, interest: 65, ads: 38 },
  { month: "Oct", saturation: 52, interest: 68, ads: 45 },
  { month: "Nov", saturation: 58, interest: 72, ads: 52 },
  { month: "Dec", saturation: 63, interest: 78, ads: 58 },
  { month: "Jan", saturation: 67, interest: 82, ads: 65 },
];

const hashtagTrends = [
  { tag: "#watermarkremover", growth: 42, volume: "2.3M", trend: "up" },
  { tag: "#removewatermark", growth: 28, volume: "1.8M", trend: "up" },
  { tag: "#photoediting", growth: 15, volume: "45M", trend: "up" },
  { tag: "#aiphotoeditor", growth: 67, volume: "890K", trend: "up" },
  { tag: "#designhacks", growth: -5, volume: "12M", trend: "down" },
];

const soundTrends = [
  { name: "Original Sound - Tech Tips", uses: "234K", growth: 89 },
  { name: "Aesthetic Editing Tutorial", uses: "156K", growth: 45 },
  { name: "POV: You Found It", uses: "89K", growth: 32 },
];

const creatorTrends = [
  { name: "@designwithme", followers: "2.4M", niche: "Design Tools", engagement: 8.2 },
  { name: "@photohacks", followers: "1.8M", niche: "Photo Editing", engagement: 7.5 },
  { name: "@toolsfordesigners", followers: "890K", niche: "Software Reviews", engagement: 9.1 },
];

const chartConfig = {
  saturation: {
    label: "Market Saturation",
    color: "hsl(var(--chart-1))",
  },
  interest: {
    label: "Search Interest",
    color: "hsl(var(--chart-2))",
  },
  ads: {
    label: "Active Ads",
    color: "hsl(var(--chart-3))",
  },
};

function getTrendIcon(trend: string) {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Trends</h1>
        <p className="text-muted-foreground">
          Track market saturation, search interest, and content trends over time
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Saturation Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">+22%</span>
            </div>
            <p className="text-xs text-muted-foreground">vs 6 months ago</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Search Interest</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">+32%</span>
            </div>
            <p className="text-xs text-muted-foreground">Growing demand</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Advertisers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">+91%</span>
            </div>
            <p className="text-xs text-muted-foreground">More competition</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Opportunity Window</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">Open</span>
            </div>
            <p className="text-xs text-muted-foreground">Interest &gt; saturation</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          <TabsTrigger value="sounds">Sounds</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Market Metrics Over Time</CardTitle>
                <CardDescription>
                  6-month trend of key market indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="saturation"
                        stroke="var(--color-saturation)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="interest"
                        stroke="var(--color-interest)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="ads"
                        stroke="var(--color-ads)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Interest Growth</CardTitle>
                <CardDescription>
                  Relative search volume over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="interest"
                        stroke="var(--color-interest)"
                        fill="var(--color-interest)"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis Summary</CardTitle>
              <CardDescription>
                Key insights from trend data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">Opportunity Signal</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Search interest is growing faster than market saturation, indicating room for new entrants.
                  </p>
                </div>
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-600 mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">Competition Rising</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Active advertisers nearly doubled in 6 months. Early mover advantage is shrinking.
                  </p>
                </div>
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">Timing</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Optimal entry window: 3-6 months before saturation catches up to interest.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hashtags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Trending Hashtags
              </CardTitle>
              <CardDescription>
                Top hashtags in your niche with growth metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hashtagTrends.map((hashtag, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{hashtag.tag}</span>
                        {getTrendIcon(hashtag.trend)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {hashtag.volume} total posts
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${hashtag.growth > 0 ? "text-green-600" : "text-red-600"}`}>
                        {hashtag.growth > 0 ? "+" : ""}{hashtag.growth}%
                      </div>
                      <p className="text-xs text-muted-foreground">30-day growth</p>
                    </div>
                    <div className="w-24">
                      <Progress value={Math.abs(hashtag.growth)} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sounds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Trending Sounds
              </CardTitle>
              <CardDescription>
                Popular audio tracks used in niche content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {soundTrends.map((sound, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{sound.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {sound.uses} uses
                      </p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-0">
                      +{sound.growth}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Creators in Niche
              </CardTitle>
              <CardDescription>
                Influential creators posting about this topic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creatorTrends.map((creator, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{creator.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{creator.followers} followers</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">{creator.niche}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{creator.engagement}%</div>
                      <p className="text-xs text-muted-foreground">Engagement</p>
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

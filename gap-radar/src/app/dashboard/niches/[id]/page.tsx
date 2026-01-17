"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  Users,
  DollarSign,
  Zap,
  Settings as SettingsIcon,
  Mail,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import ProgressChart from "./components/ProgressChart";

interface Niche {
  id: string;
  offering_name: string;
  category: string;
  niche_tags: string[];
  customer_profile: {
    type: string;
    segment: string;
    pricePoint: string;
  };
  keywords: string[];
  competitors: string[];
  geo: string;
  is_active: boolean;
  created_at: string;
}

interface Snapshot {
  id: string;
  demand_score: number;
  trend: "up" | "down" | "stable";
  demand_score_change: number;
  opportunity_score: number;
  message_market_fit_score: number;
  week_start: string;
  ad_signals: any;
  search_signals: any;
  ugc_signals: any;
  forum_signals: any;
  competitor_signals: any;
  plays: any[];
  ad_hooks: string[];
  subject_lines: string[];
  landing_copy: string;
}

export default function NicheDetailPage() {
  const params = useParams();
  const router = useRouter();
  const nicheId = params.id as string;

  const [niche, setNiche] = useState<Niche | null>(null);
  const [latestSnapshot, setLatestSnapshot] = useState<Snapshot | null>(null);
  const [allSnapshots, setAllSnapshots] = useState<Snapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (nicheId) {
      fetchNiche();
    }
  }, [nicheId]);

  const fetchNiche = async () => {
    try {
      const response = await fetch(`/api/niches/${nicheId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch niche");
      }
      const data = await response.json();
      setNiche(data.niche);
      setLatestSnapshot(data.latestSnapshot);
      setAllSnapshots(data.allSnapshots || []);
    } catch (error) {
      console.error("Error fetching niche:", error);
      toast.error("Failed to load niche details");
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "down":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  if (!niche) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Target className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Niche not found</h2>
        <Button asChild>
          <Link href="/dashboard/niches">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Niches
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{niche.offering_name}</h1>
            <p className="text-muted-foreground">{niche.category}</p>
          </div>
        </div>
        {!niche.is_active && (
          <Badge variant="secondary">Paused</Badge>
        )}
      </div>

      {/* Score Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demand Score</CardTitle>
            {latestSnapshot && getTrendIcon(latestSnapshot.trend)}
          </CardHeader>
          <CardContent>
            {latestSnapshot ? (
              <>
                <div className="text-3xl font-bold">
                  {latestSnapshot.demand_score}
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {latestSnapshot.demand_score_change > 0 ? "+" : ""}
                  {latestSnapshot.demand_score_change} from last week
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunity</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestSnapshot ? (
              <>
                <div className="text-3xl font-bold">
                  {latestSnapshot.opportunity_score}
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Market gap potential
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Message-Market Fit
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestSnapshot ? (
              <>
                <div className="text-3xl font-bold">
                  {latestSnapshot.message_market_fit_score}
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ad-to-pain alignment
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="briefs">Briefs</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {latestSnapshot ? (
            <>
              {/* Plays */}
              {latestSnapshot.plays && latestSnapshot.plays.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Plays</CardTitle>
                    <CardDescription>
                      Actions to test this week
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {latestSnapshot.plays.map((play: any, index: number) => (
                      <div
                        key={index}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <Badge>{play.type}</Badge>
                          <h4 className="font-semibold">{play.action}</h4>
                        </div>
                        {play.evidence && (
                          <p className="text-sm text-muted-foreground">
                            {play.evidence}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Copy Library */}
              {latestSnapshot.ad_hooks && latestSnapshot.ad_hooks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Copy Library</CardTitle>
                    <CardDescription>
                      Copy-paste hooks and lines from latest brief
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Ad Hooks</h4>
                      <ul className="space-y-2">
                        {latestSnapshot.ad_hooks.map((hook, index) => (
                          <li
                            key={index}
                            className="rounded border p-2 text-sm hover:bg-muted cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(hook);
                              toast.success("Copied to clipboard!");
                            }}
                          >
                            {hook}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {latestSnapshot.subject_lines &&
                      latestSnapshot.subject_lines.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Subject Lines</h4>
                          <ul className="space-y-2">
                            {latestSnapshot.subject_lines.map((line, index) => (
                              <li
                                key={index}
                                className="rounded border p-2 text-sm hover:bg-muted cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(line);
                                  toast.success("Copied to clipboard!");
                                }}
                              >
                                {line}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  First brief coming soon
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  We'll start collecting demand signals for this niche. Your
                  first Demand Brief will arrive next week via email.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress">
          <ProgressChart snapshots={allSnapshots} nicheName={niche.offering_name} />
        </TabsContent>

        {/* Briefs Tab */}
        <TabsContent value="briefs">
          <Card>
            <CardHeader>
              <CardTitle>Brief History</CardTitle>
              <CardDescription>All weekly demand briefs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Brief history coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Niche Configuration</CardTitle>
              <CardDescription>
                Keywords, competitors, and tracking settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Keywords ({niche.keywords.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {niche.keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">
                  Competitors ({niche.competitors.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {niche.competitors.map((competitor) => (
                    <Badge key={competitor} variant="secondary">
                      {competitor}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Customer Profile</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{niche.customer_profile.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Segment:</span>
                    <span>{niche.customer_profile.segment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price Point:</span>
                    <span className="capitalize">
                      {niche.customer_profile.pricePoint}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Edit Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Settings,
  Calendar,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Niche {
  id: string;
  offering_name: string;
  category: string;
  niche_tags: string[];
  keywords: string[];
  competitors: string[];
  is_active: boolean;
  created_at: string;
}

interface Snapshot {
  demand_score: number;
  trend: "up" | "down" | "stable";
  demand_score_change: number;
  week_start: string;
}

interface NicheWithSnapshot extends Niche {
  latestSnapshot?: Snapshot;
}

export default function NichesPage() {
  const router = useRouter();
  const [niches, setNiches] = useState<NicheWithSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNiches();
  }, []);

  const fetchNiches = async () => {
    try {
      const response = await fetch("/api/niches");
      if (!response.ok) {
        throw new Error("Failed to fetch niches");
      }
      const data = await response.json();
      setNiches(data.niches || []);
    } catch (error) {
      console.error("Error fetching niches:", error);
      toast.error("Failed to load niches");
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Niches</h1>
            <p className="text-muted-foreground">
              Track demand signals for your offerings
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Niches</h1>
          <p className="text-muted-foreground">
            Track demand signals for your offerings
          </p>
        </div>
        <Button asChild>
          <Link href="/onboarding">
            <Plus className="mr-2 h-4 w-4" />
            Add Niche
          </Link>
        </Button>
      </div>

      {/* Empty State */}
      {niches.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No niches yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Start tracking demand for your offering. We'll send you weekly
              briefs with market insights and actionable plays.
            </p>
            <Button asChild>
              <Link href="/onboarding">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Niche
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Niches Grid */}
      {niches.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {niches.map((niche) => (
            <Card
              key={niche.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/niches/${niche.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {niche.offering_name}
                    </CardTitle>
                    {niche.category && (
                      <CardDescription>{niche.category}</CardDescription>
                    )}
                  </div>
                  {!niche.is_active && (
                    <Badge variant="secondary">Paused</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Demand Score */}
                {niche.latestSnapshot ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Demand Score
                      </span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(niche.latestSnapshot.trend)}
                        <span
                          className={`text-sm font-medium ${getTrendColor(
                            niche.latestSnapshot.trend
                          )}`}
                        >
                          {niche.latestSnapshot.demand_score_change > 0
                            ? "+"
                            : ""}
                          {niche.latestSnapshot.demand_score_change}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold">
                        {niche.latestSnapshot.demand_score}
                      </span>
                      <span className="text-muted-foreground pb-1">/100</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      First brief coming soon
                    </p>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {niche.niche_tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {niche.niche_tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{niche.niche_tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Keywords</div>
                    <div className="font-semibold">{niche.keywords.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Competitors</div>
                    <div className="font-semibold">
                      {niche.competitors.length}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/niches/${niche.id}`);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/niches/${niche.id}?tab=settings`);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

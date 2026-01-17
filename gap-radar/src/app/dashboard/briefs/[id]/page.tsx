/**
 * Demand Brief Web View
 *
 * Web version of the weekly Demand Brief email
 * Route: /dashboard/briefs/[id]
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight, Copy, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";

interface DemandSnapshot {
  id: string;
  niche_id: string;
  offering_name: string;
  week_start: string;
  demand_score: number;
  demand_score_change: number;
  opportunity_score: number;
  message_market_fit_score: number;
  trend: "up" | "down" | "stable";
  ad_signals: {
    advertiserCount: number;
    topAngles: string[];
    topOffers: string[];
  };
  search_signals: {
    buyerIntentKeywords: Array<{ keyword: string; volume?: number }>;
  };
  forum_signals: {
    complaints: Array<{ text: string; count: number }>;
    desires: Array<{ text: string; count: number }>;
  };
  competitor_signals: {
    activeCompetitors: number;
  };
  plays: Array<{
    type: "product" | "offer" | "distribution";
    action: string;
    evidence: string;
    priority: "high" | "medium" | "low";
  }>;
  ad_hooks: string[];
  subject_lines: string[];
  landing_copy: string;
  why_score_changed: string[];
  created_at: string;
}

export default function BriefDetailPage() {
  const params = useParams();
  const router = useRouter();
  const briefId = params.id as string;

  const [snapshot, setSnapshot] = useState<DemandSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    if (briefId) {
      fetchSnapshot();
    }
  }, [briefId]);

  const fetchSnapshot = async () => {
    try {
      const response = await fetch(`/api/briefs/${briefId}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Brief not found");
          router.push("/dashboard/niches");
          return;
        }
        throw new Error("Failed to fetch brief");
      }

      const data = await response.json();
      setSnapshot(data);
    } catch (error) {
      console.error("Error fetching brief:", error);
      toast.error("Failed to load brief");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      toast.success(`Copied to clipboard!`);

      setTimeout(() => {
        setCopiedItem(null);
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const getTrendIcon = () => {
    if (!snapshot) return null;

    if (snapshot.trend === "up") {
      return <ArrowUp className="h-5 w-5 text-green-600" />;
    } else if (snapshot.trend === "down") {
      return <ArrowDown className="h-5 w-5 text-red-600" />;
    } else {
      return <ArrowRight className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    if (!snapshot) return "text-gray-600";
    if (snapshot.trend === "up") return "text-green-600";
    if (snapshot.trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  const getPlayTypeEmoji = (type: string) => {
    switch (type) {
      case "product":
        return "🛠️";
      case "offer":
        return "💰";
      case "distribution":
        return "📣";
      default:
        return "🎯";
    }
  };

  const getPlayTypeLabel = (type: string) => {
    switch (type) {
      case "product":
        return "PRODUCT PLAY";
      case "offer":
        return "OFFER PLAY";
      case "distribution":
        return "DISTRIBUTION PLAY";
      default:
        return "PLAY";
    }
  };

  if (loading) {
    return (
      <div className="container max-w-5xl py-8">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="container max-w-5xl py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Brief not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weekStartDate = new Date(snapshot.week_start);
  const formattedDate = weekStartDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Demand Brief</h1>
            <p className="text-sm text-muted-foreground">
              {snapshot.offering_name} · Week of {formattedDate}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Demand Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground tracking-wide">
            DEMAND SCORE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Score */}
          <div className="flex items-baseline gap-4">
            <span className="text-6xl font-bold">{snapshot.demand_score}</span>
            <div className={`flex items-center gap-2 text-xl font-bold ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>
                {snapshot.demand_score_change > 0 ? "+" : ""}
                {snapshot.demand_score_change}
              </span>
            </div>
          </div>

          {/* Sub-Metrics */}
          <div className="flex gap-8 pt-4 border-t">
            <div>
              <div className="text-sm text-muted-foreground">Opportunity</div>
              <div className="text-2xl font-bold">{snapshot.opportunity_score}/100</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Message Fit</div>
              <div className="text-2xl font-bold">
                {snapshot.message_market_fit_score}/100
              </div>
            </div>
          </div>

          {/* Why Changed */}
          {snapshot.why_score_changed && snapshot.why_score_changed.length > 0 && (
            <div className="pt-4 border-t">
              <p className="font-semibold mb-2">Why it changed:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {snapshot.why_score_changed.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What Changed This Week */}
      <Card>
        <CardHeader>
          <CardTitle>📈 What Changed This Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ads */}
          <div className="space-y-1">
            <div className="font-semibold text-sm">🎯 Ads</div>
            <p className="text-sm text-muted-foreground">
              {snapshot.ad_signals.advertiserCount} advertisers active.{" "}
              <strong>New angles:</strong>{" "}
              {snapshot.ad_signals.topAngles.slice(0, 3).join(", ")}
            </p>
          </div>

          <Separator />

          {/* Search */}
          <div className="space-y-1">
            <div className="font-semibold text-sm">🔍 Search</div>
            <p className="text-sm text-muted-foreground">
              <strong>Rising:</strong>{" "}
              {snapshot.search_signals.buyerIntentKeywords
                .slice(0, 3)
                .map((kw) => kw.keyword)
                .join(", ")}
            </p>
          </div>

          <Separator />

          {/* Forums */}
          <div className="space-y-1">
            <div className="font-semibold text-sm">💬 Forums</div>
            <p className="text-sm text-muted-foreground">
              <strong>Top complaints:</strong>{" "}
              {snapshot.forum_signals.complaints
                .slice(0, 2)
                .map((c) => c.text)
                .join(", ")}
              . <strong>Top desires:</strong>{" "}
              {snapshot.forum_signals.desires
                .slice(0, 2)
                .map((d) => d.text)
                .join(", ")}
            </p>
          </div>

          <Separator />

          {/* Competitors */}
          <div className="space-y-1">
            <div className="font-semibold text-sm">⚔️ Competitors</div>
            <p className="text-sm text-muted-foreground">
              {snapshot.competitor_signals.activeCompetitors} active competitors in the
              market
            </p>
          </div>
        </CardContent>
      </Card>

      {/* What To Do Next (3 Plays) */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 What To Do Next (3 Plays)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {snapshot.plays.map((play, i) => (
            <Card key={i} className="border bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold tracking-wide">
                        {getPlayTypeEmoji(play.type)} {getPlayTypeLabel(play.type)}
                      </span>
                      {play.priority === "high" && (
                        <Badge variant="secondary" className="text-xs">
                          HIGH PRIORITY
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold mb-2">{play.action}</p>
                    <p className="text-sm text-muted-foreground italic">
                      💡 {play.evidence}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Copy You Can Paste */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Copy You Can Paste</CardTitle>
          <CardDescription>
            Click any item to copy to clipboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ad Hooks */}
          <div>
            <h3 className="font-bold text-sm mb-3 tracking-wide">AD HOOKS:</h3>
            <div className="space-y-2">
              {snapshot.ad_hooks.slice(0, 5).map((hook, i) => (
                <button
                  key={i}
                  onClick={() => copyToClipboard(hook, `hook-${i}`)}
                  className="flex items-center justify-between w-full p-3 text-sm bg-muted hover:bg-muted/70 rounded-md transition-colors text-left group"
                >
                  <span>"{hook}"</span>
                  {copiedItem === `hook-${i}` ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Subject Lines */}
          <div>
            <h3 className="font-bold text-sm mb-3 tracking-wide">SUBJECT LINES:</h3>
            <div className="space-y-2">
              {snapshot.subject_lines.slice(0, 5).map((subject, i) => (
                <button
                  key={i}
                  onClick={() => copyToClipboard(subject, `subject-${i}`)}
                  className="flex items-center justify-between w-full p-3 text-sm bg-muted hover:bg-muted/70 rounded-md transition-colors text-left group"
                >
                  <span>"{subject}"</span>
                  {copiedItem === `subject-${i}` ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Landing Page Copy */}
          <div>
            <h3 className="font-bold text-sm mb-3 tracking-wide">
              LANDING PAGE PARAGRAPH:
            </h3>
            <button
              onClick={() => copyToClipboard(snapshot.landing_copy, "landing")}
              className="flex items-start justify-between w-full p-4 text-sm bg-muted hover:bg-muted/70 rounded-md transition-colors text-left group"
            >
              <span className="flex-1 leading-relaxed">{snapshot.landing_copy}</span>
              {copiedItem === "landing" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 ml-4" />
              ) : (
                <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>
          Generated on {new Date(snapshot.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

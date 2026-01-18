"use client";

import { use, useState, useEffect, lazy, Suspense } from "react";
import { ReportHeader } from "./components/ReportHeader";
import { ReportNav } from "./components/ReportNav";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Lazy load heavy components for better performance
const MarketSnapshot = lazy(() => import("./components/MarketSnapshot").then(m => ({ default: m.MarketSnapshot })));
const PainMap = lazy(() => import("./components/PainMap").then(m => ({ default: m.PainMap })));
const PlatformGap = lazy(() => import("./components/PlatformGap").then(m => ({ default: m.PlatformGap })));
const GapOpportunities = lazy(() => import("./components/GapOpportunities").then(m => ({ default: m.GapOpportunities })));
const Economics = lazy(() => import("./components/Economics").then(m => ({ default: m.Economics })));
const Buildability = lazy(() => import("./components/Buildability").then(m => ({ default: m.Buildability })));
const UGCPack = lazy(() => import("./components/UGCPack").then(m => ({ default: m.UGCPack })));
const ActionPlan = lazy(() => import("./components/ActionPlan"));

interface ReportData {
  run: {
    id: string;
    niche_query: string;
    status: string;
    created_at: string;
    finished_at: string | null;
  };
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
  marketSnapshot: {
    topAdvertisers: { name: string; adCount: number }[];
    topAngles: { label: string; frequency: number }[];
    longestRunningAds: { advertiser: string; headline: string; daysRunning: number }[];
  };
  painMap: {
    topObjections: { label: string; frequency: number; intensity: number }[];
    topFeatures: { label: string; frequency: number }[];
    pricingFriction: string[];
    trustIssues: string[];
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
  concepts: {
    id: string;
    name: string;
    oneLiner: string;
    platform: string;
    industry: string;
    businessModel: string;
    difficulty: number;
    opportunityScore: number;
  }[];
  ugc: {
    hooks: { text: string; type: string }[];
    scripts: { duration: string; outline: string[] }[];
    shotList: { shot: string; description: string }[];
    angleMap: { angle: string; priority: number; examples: string[] }[];
  } | null;
  economics: {
    conceptId: string;
    name: string;
    cpc: { low: number; expected: number; high: number };
    cac: { low: number; expected: number; high: number };
    tam: { low: number; expected: number; high: number };
  }[];
  buildability: {
    conceptId: string;
    name: string;
    implementationDifficulty: number;
    buildDifficulty: number;
    distributionDifficulty: number;
    humanTouchLevel: string;
    autonomousSuitability: string;
  }[];
  actionPlan: {
    sevenDay: {
      day: number;
      task: string;
      category: 'research' | 'build' | 'marketing' | 'content' | 'validation';
      effort: 'low' | 'medium' | 'high';
      resources?: string[];
      deliverable?: string;
      priority: 'critical' | 'high' | 'medium';
    }[];
    thirtyDay: {
      day: number;
      task: string;
      category: 'research' | 'build' | 'marketing' | 'content' | 'validation';
      effort: 'low' | 'medium' | 'high';
      resources?: string[];
      deliverable?: string;
      priority: 'critical' | 'high' | 'medium';
    }[];
    quickWins: string[];
    keyRisks: string[];
    nextSteps: string;
  } | null;
}

// Loading skeleton for lazy-loaded components
function ComponentLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <CardTitle className="text-muted-foreground">Loading section...</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
          <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeSection, setActiveSection] = useState("summary");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reports/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch report: ${response.statusText}`);
        }

        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setIsLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Failed to load report"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader
        nicheQuery={reportData.run.niche_query}
        createdAt={reportData.run.created_at}
        runId={reportData.run.id}
      />

      <ReportNav activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="space-y-6">
        {activeSection === "summary" && (
          <ExecutiveSummary
            scores={reportData.scores}
            summary={reportData.summary}
            gaps={reportData.gaps}
            nicheQuery={reportData.run.niche_query}
          />
        )}

        {activeSection === "market" && (
          <Suspense fallback={<ComponentLoadingSkeleton />}>
            <MarketSnapshot
              marketSnapshot={reportData.marketSnapshot}
              summary={reportData.summary}
            />
          </Suspense>
        )}

        {activeSection === "pain" && (
          <Suspense fallback={<ComponentLoadingSkeleton />}>
            <PainMap
              painMap={reportData.painMap}
              summary={reportData.summary}
            />
          </Suspense>
        )}

        {activeSection === "platform" && (
          <Suspense fallback={<ComponentLoadingSkeleton />}>
            <PlatformGap
              gaps={reportData.gaps}
              summary={reportData.summary}
            />
          </Suspense>
        )}

        {activeSection === "gaps" && (
          <Suspense fallback={<ComponentLoadingSkeleton />}>
            <GapOpportunities gaps={reportData.gaps} />
          </Suspense>
        )}

        {activeSection === "economics" && (
          <Suspense fallback={<ComponentLoadingSkeleton />}>
            <Economics economics={reportData.economics} />
          </Suspense>
        )}

        {activeSection === "buildability" && (
          <Suspense fallback={<ComponentLoadingSkeleton />}>
            <Buildability buildability={reportData.buildability} />
          </Suspense>
        )}

        {activeSection === "ugc" && (
          <Suspense fallback={<ComponentLoadingSkeleton />}>
            <UGCPack ugc={reportData.ugc} />
          </Suspense>
        )}

        {activeSection === "action" && (
          <Suspense fallback={<ComponentLoadingSkeleton />}>
            <ActionPlan actionPlan={reportData.actionPlan} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

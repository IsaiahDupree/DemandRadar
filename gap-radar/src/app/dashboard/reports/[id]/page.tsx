"use client";

import { use, useState, useEffect } from "react";
import { ReportHeader } from "./components/ReportHeader";
import { ReportNav } from "./components/ReportNav";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { MarketSnapshot } from "./components/MarketSnapshot";
import { PainMap } from "./components/PainMap";
import { PlatformGap } from "./components/PlatformGap";
import { GapOpportunities } from "./components/GapOpportunities";
import { Economics } from "./components/Economics";
import { Buildability } from "./components/Buildability";
import { UGCPack } from "./components/UGCPack";
import ActionPlan from "./components/ActionPlan";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
          <MarketSnapshot
            marketSnapshot={reportData.marketSnapshot}
            summary={reportData.summary}
          />
        )}

        {activeSection === "pain" && (
          <PainMap
            painMap={reportData.painMap}
            summary={reportData.summary}
          />
        )}

        {activeSection === "platform" && (
          <PlatformGap
            gaps={reportData.gaps}
            summary={reportData.summary}
          />
        )}

        {activeSection === "gaps" && (
          <GapOpportunities gaps={reportData.gaps} />
        )}

        {activeSection === "economics" && (
          <Economics economics={reportData.economics} />
        )}

        {activeSection === "buildability" && (
          <Buildability buildability={reportData.buildability} />
        )}

        {activeSection === "ugc" && (
          <UGCPack ugc={reportData.ugc} />
        )}

        {activeSection === "action" && (
          <ActionPlan actionPlan={reportData.actionPlan} />
        )}
      </div>
    </div>
  );
}

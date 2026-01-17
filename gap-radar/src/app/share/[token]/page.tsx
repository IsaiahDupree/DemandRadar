"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReportHeader } from "@/app/dashboard/reports/[id]/components/ReportHeader";
import { ReportNav } from "@/app/dashboard/reports/[id]/components/ReportNav";
import { ExecutiveSummary } from "@/app/dashboard/reports/[id]/components/ExecutiveSummary";
import { MarketSnapshot } from "@/app/dashboard/reports/[id]/components/MarketSnapshot";
import { PainMap } from "@/app/dashboard/reports/[id]/components/PainMap";
import { PlatformGap } from "@/app/dashboard/reports/[id]/components/PlatformGap";
import { GapOpportunities } from "@/app/dashboard/reports/[id]/components/GapOpportunities";
import { Economics } from "@/app/dashboard/reports/[id]/components/Economics";
import { Buildability } from "@/app/dashboard/reports/[id]/components/Buildability";
import { UGCPack } from "@/app/dashboard/reports/[id]/components/UGCPack";
import ActionPlan from "@/app/dashboard/reports/[id]/components/ActionPlan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock } from "lucide-react";
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

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("summary");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchSharedReport();
  }, [token]);

  const fetchSharedReport = async (passwordAttempt?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (passwordAttempt) {
        headers['X-Share-Password'] = passwordAttempt;
      }

      const response = await fetch(`/api/share/${token}`, { headers });

      if (response.status === 401) {
        // Password required or incorrect
        setRequiresPassword(true);
        setIsLoading(false);
        return;
      }

      if (response.status === 404) {
        setError("This share link does not exist or has expired.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch shared report: ${response.statusText}`);
      }

      const data = await response.json();
      setReportData(data);
      setRequiresPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shared report");
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    await fetchSharedReport(password);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64 mx-auto" />
          <div className="h-4 bg-muted rounded w-96 mx-auto" />
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Password Protected</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              This report requires a password to view
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isVerifying}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Invalid password. Please try again.</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isVerifying || !password}>
                {isVerifying ? "Verifying..." : "Access Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Failed to load shared report"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Branding header for shared reports */}
        <div className="mb-6 pb-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">DemandRadar</h2>
              <p className="text-sm text-muted-foreground">Shared Market Analysis Report</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/')}>
              Create Your Own Report
            </Button>
          </div>
        </div>

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
      </div>
    </div>
  );
}

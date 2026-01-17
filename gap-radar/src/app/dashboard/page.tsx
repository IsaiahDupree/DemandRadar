"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { mockRuns, mockGapOpportunities, mockConceptIdeas } from "@/lib/mock-data";
import { Play, Target, Lightbulb, TrendingUp, ArrowRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

const scoreData = [
  { metric: "Saturation", score: 67 },
  { metric: "Longevity", score: 78 },
  { metric: "Dissatisfaction", score: 72 },
  { metric: "Misalignment", score: 58 },
  { metric: "Opportunity", score: 74 },
];

const radarData = [
  { subject: "Saturation", A: 67, fullMark: 100 },
  { subject: "Longevity", A: 78, fullMark: 100 },
  { subject: "Dissatisfaction", A: 72, fullMark: 100 },
  { subject: "Misalignment", A: 58, fullMark: 100 },
  { subject: "Opportunity", A: 74, fullMark: 100 },
];

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--chart-1))",
  },
};

function getStatusIcon(status: string) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "running":
      return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Complete</Badge>;
    case "running":
      return <Badge variant="default" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Running</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Queued</Badge>;
  }
}

export default function DashboardPage() {
  const completedRuns = mockRuns.filter((r) => r.status === "complete");
  const latestRun = completedRuns[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Market gap analysis and product idea generation
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/new-run">
            <Play className="mr-2 h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockRuns.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedRuns.length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gap Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGapOpportunities.length}</div>
            <p className="text-xs text-muted-foreground">
              Avg score: {Math.round(mockGapOpportunities.reduce((a, b) => a + b.opportunityScore, 0) / mockGapOpportunities.length)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Ideas</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockConceptIdeas.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockConceptIdeas.filter((c) => c.metrics?.opportunityScore && c.metrics.opportunityScore > 75).length} high opportunity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(completedRuns.reduce((a, b) => a + (b.scores?.confidence || 0), 0) / completedRuns.length * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Data quality score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Latest Analysis Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Analysis: {latestRun?.nicheQuery}</CardTitle>
            <CardDescription>
              Score breakdown from market analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="metric" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="score" fill="var(--color-score)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Opportunity Radar</CardTitle>
            <CardDescription>
              Multi-dimensional market opportunity view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" className="text-xs" />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Runs</CardTitle>
            <CardDescription>Your latest market analysis runs</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/runs">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Niche</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        {run.nicheQuery}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell>
                      {run.status === "complete" ? (
                        <div className="flex items-center gap-2">
                          <Progress value={run.scores?.opportunity} className="w-16 h-2" />
                          <span className="text-sm">{run.scores?.opportunity}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {run.status === "complete" ? (
                        <span>{Math.round((run.scores?.confidence || 0) * 100)}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {run.startedAt?.toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {mockRuns.map((run) => (
              <div key={run.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getStatusIcon(run.status)}
                    <span className="font-medium truncate">{run.nicheQuery}</span>
                  </div>
                  {getStatusBadge(run.status)}
                </div>
                {run.status === "complete" && (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Opportunity</span>
                      <div className="flex items-center gap-2">
                        <Progress value={run.scores?.opportunity} className="w-12 h-1.5" />
                        <span className="font-medium">{run.scores?.opportunity}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium">{Math.round((run.scores?.confidence || 0) * 100)}%</span>
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {run.startedAt?.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Gap Opportunities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Gap Opportunities</CardTitle>
            <CardDescription>Highest-scoring market gaps from your analyses</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/gaps">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockGapOpportunities.slice(0, 3).map((gap, index) => (
              <div key={gap.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{gap.title}</h4>
                    <Badge variant="outline">{gap.gapType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {gap.problem}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Score: <span className="font-medium text-foreground">{gap.opportunityScore}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Confidence: <span className="font-medium text-foreground">{Math.round(gap.confidence * 100)}%</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

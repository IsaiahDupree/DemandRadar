"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Milestone, AlertCircle, CheckCircle } from 'lucide-react';

// Helper function to format dates
function formatDate(dateStr: string, formatType: 'short' | 'long' = 'short'): string {
  const date = new Date(dateStr);
  if (formatType === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface ProgressDataPoint {
  id: string;
  date: string;
  opportunityScore: number;
  demandScore: number;
  saturationScore: number;
  milestone: string | null;
}

interface Insight {
  id: string;
  date: string;
  type: 'positive' | 'warning' | 'info';
  message: string;
}

interface ProgressTrackerProps {
  nicheName: string;
  progressData: ProgressDataPoint[];
  insights: Insight[];
}

export default function ProgressTracker({
  nicheName,
  progressData,
  insights,
}: ProgressTrackerProps) {
  // Calculate metrics
  const currentData = progressData[0];
  const firstData = progressData[progressData.length - 1];

  const opportunityChange = currentData && firstData
    ? currentData.opportunityScore - firstData.opportunityScore
    : 0;

  const milestones = progressData.filter(d => d.milestone);

  const trackingDuration = currentData && firstData
    ? Math.abs(
        Math.floor(
          (new Date(currentData.date).getTime() - new Date(firstData.date).getTime()) /
          (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // Format data for chart (reverse to show chronologically)
  const chartData = [...progressData].reverse().map(d => ({
    date: formatDate(d.date, 'short'),
    Opportunity: d.opportunityScore,
    Demand: d.demandScore,
    Saturation: d.saturationScore,
  }));

  // Empty state
  if (!progressData || progressData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progress Tracker</CardTitle>
          <CardDescription>Track your niche evolution over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No progress data yet</p>
            <p className="text-sm mt-2">Run your first analysis to start tracking</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{nicheName}</h2>
        <p className="text-muted-foreground">Tracking for {trackingDuration} days</p>
      </div>

      {/* Score Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Opportunity Score</CardDescription>
            <CardTitle className="text-3xl">{currentData?.opportunityScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {opportunityChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={opportunityChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {opportunityChange >= 0 ? '+' : ''}{opportunityChange}
              </span>
              <span className="text-sm text-muted-foreground">since start</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Demand Score</CardDescription>
            <CardTitle className="text-3xl">{currentData?.demandScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Current market demand
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Saturation Score</CardDescription>
            <CardTitle className="text-3xl">{currentData?.saturationScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Market competition level
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Score Evolution</CardTitle>
          <CardDescription>
            Track how your niche scores have changed over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Opportunity"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Demand"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Saturation"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Milestone className="h-5 w-5" />
            Milestones
          </CardTitle>
          <CardDescription>
            {milestones.length} milestones tracked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className="h-3 w-3 rounded-full bg-primary"
                    data-milestone="true"
                  />
                  {index < milestones.length - 1 && (
                    <div className="w-0.5 h-12 bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{milestone.milestone}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(milestone.date, 'long')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Opportunity: {milestone.opportunityScore} |
                    Demand: {milestone.demandScore} |
                    Saturation: {milestone.saturationScore}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Timeline</CardTitle>
          <CardDescription>
            Key observations and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No insights yet</p>
              <p className="text-sm mt-2">Insights will appear as your niche evolves</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div className="mt-0.5">
                    {insight.type === 'positive' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {insight.type === 'warning' && (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    {insight.type === 'info' && (
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{insight.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {insight.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

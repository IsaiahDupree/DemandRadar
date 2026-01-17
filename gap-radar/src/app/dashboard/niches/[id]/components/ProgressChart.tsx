/**
 * Progress Chart Component
 *
 * Displays niche score evolution over time with charts
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DemandSnapshot {
  id: string;
  week_start: string;
  demand_score: number;
  demand_score_change: number;
  opportunity_score: number;
  message_market_fit_score: number;
  trend: 'up' | 'down' | 'stable';
  ad_signals: {
    new_advertisers: number;
    avg_longevity_days: number;
  };
  search_signals: {
    volume_change_pct: number;
  };
}

interface ProgressChartProps {
  snapshots: DemandSnapshot[];
  nicheName: string;
}

export default function ProgressChart({ snapshots, nicheName }: ProgressChartProps) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">
            No historical data yet. Progress tracking will appear after your first weekly snapshot.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format data for charts
  const chartData = snapshots
    .slice()
    .reverse()
    .map((snapshot) => ({
      week: new Date(snapshot.week_start).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      demandScore: snapshot.demand_score,
      opportunityScore: snapshot.opportunity_score,
      messageMarketFit: snapshot.message_market_fit_score,
      newAdvertisers: snapshot.ad_signals.new_advertisers,
      searchVolume: snapshot.search_signals.volume_change_pct,
    }));

  // Calculate statistics
  const latestSnapshot = snapshots[0];
  const oldestSnapshot = snapshots[snapshots.length - 1];
  const totalChange = latestSnapshot.demand_score - oldestSnapshot.demand_score;
  const percentChange =
    oldestSnapshot.demand_score > 0
      ? ((totalChange / oldestSnapshot.demand_score) * 100).toFixed(1)
      : 0;

  const averageScore =
    snapshots.reduce((sum, s) => sum + s.demand_score, 0) / snapshots.length;

  const TrendIcon =
    latestSnapshot.trend === 'up'
      ? TrendingUp
      : latestSnapshot.trend === 'down'
      ? TrendingDown
      : Minus;

  const trendColor =
    latestSnapshot.trend === 'up'
      ? 'text-green-600'
      : latestSnapshot.trend === 'down'
      ? 'text-red-600'
      : 'text-gray-600';

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Score</CardDescription>
            <CardTitle className="text-3xl">{latestSnapshot.demand_score}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span>
                {totalChange > 0 ? '+' : ''}
                {totalChange} pts
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Change</CardDescription>
            <CardTitle className="text-3xl">
              {totalChange > 0 ? '+' : ''}
              {percentChange}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Since {snapshots.length} weeks ago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-3xl">{averageScore.toFixed(0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Over {snapshots.length} weeks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trend</CardDescription>
            <CardTitle className="text-3xl capitalize flex items-center gap-2">
              <TrendIcon className={`h-6 w-6 ${trendColor}`} />
              {latestSnapshot.trend}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Current trajectory</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="scores" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="market">Market Activity</TabsTrigger>
          <TabsTrigger value="search">Search Trends</TabsTrigger>
        </TabsList>

        {/* Scores Tab */}
        <TabsContent value="scores">
          <Card>
            <CardHeader>
              <CardTitle>Score Evolution</CardTitle>
              <CardDescription>
                Track how your niche scores have changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="demandScore"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Demand Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="opportunityScore"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Opportunity Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="messageMarketFit"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Message-Market Fit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Activity Tab */}
        <TabsContent value="market">
          <Card>
            <CardHeader>
              <CardTitle>Market Activity</CardTitle>
              <CardDescription>
                New advertisers entering your niche each week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="newAdvertisers" fill="#3b82f6" name="New Advertisers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Trends Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Volume Changes</CardTitle>
              <CardDescription>
                Week-over-week search interest changes (%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="searchVolume"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="Search Volume Change %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

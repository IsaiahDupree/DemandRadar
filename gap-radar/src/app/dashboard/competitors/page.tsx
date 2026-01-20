"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { Plus, Bell, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CompetitorAlert {
  id: string;
  alert_type: string;
  title: string;
  description: string | null;
  created_at: string;
  is_read: boolean;
  competitor_id: string;
  tracked_competitors?: {
    competitor_name: string;
  };
}

interface TrackedCompetitor {
  id: string;
  competitor_name: string;
  competitor_domain: string | null;
  is_active: boolean;
  last_checked: string | null;
  created_at: string;
}

interface CompetitorSnapshot {
  competitor_id: string;
  snapshot_date: string;
  active_ads_count: number;
}

interface ChartData {
  date: string;
  [key: string]: number | string;
}

export default function CompetitorDashboardPage() {
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([]);
  const [competitors, setCompetitors] = useState<TrackedCompetitor[]>([]);
  const [snapshots, setSnapshots] = useState<CompetitorSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view competitive intelligence');
        setLoading(false);
        return;
      }

      // Fetch recent alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('competitor_alerts')
        .select(`
          id,
          alert_type,
          title,
          description,
          created_at,
          is_read,
          competitor_id,
          tracked_competitors (
            competitor_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (alertsError) throw alertsError;
      setAlerts(alertsData || []);

      // Fetch tracked competitors
      const { data: competitorsData, error: competitorsError } = await supabase
        .from('tracked_competitors')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (competitorsError) throw competitorsError;
      setCompetitors(competitorsData || []);

      // Fetch snapshots for chart (last 30 days)
      if (competitorsData && competitorsData.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: snapshotsData, error: snapshotsError } = await supabase
          .from('competitor_snapshots')
          .select('*')
          .in('competitor_id', competitorsData.map(c => c.id))
          .gte('snapshot_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('snapshot_date', { ascending: true });

        if (snapshotsError) throw snapshotsError;
        setSnapshots(snapshotsData || []);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function getAlertIcon(alertType: string) {
    switch (alertType) {
      case 'new_campaign':
        return <TrendingUp className="h-4 w-4" />;
      case 'campaign_ended':
        return <TrendingDown className="h-4 w-4" />;
      case 'ad_spike':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  }

  function getAlertVariant(alertType: string): "default" | "secondary" | "destructive" | "outline" {
    switch (alertType) {
      case 'new_campaign':
      case 'ad_spike':
        return 'destructive';
      case 'campaign_ended':
        return 'secondary';
      default:
        return 'default';
    }
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }

  function prepareChartData(): ChartData[] {
    if (snapshots.length === 0) return [];

    // Group snapshots by date
    const dataByDate = new Map<string, any>();

    snapshots.forEach(snapshot => {
      const date = snapshot.snapshot_date;
      if (!dataByDate.has(date)) {
        dataByDate.set(date, { date });
      }

      // Find competitor name
      const competitor = competitors.find(c => c.id === snapshot.competitor_id);
      const competitorName = competitor?.competitor_name || 'Unknown';

      dataByDate.get(date)[competitorName] = snapshot.active_ads_count;
    });

    return Array.from(dataByDate.values());
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error && error.includes('sign in')) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="Authentication Required"
              description={error}
              action={
                <Link href="/login">
                  <Button>Sign In</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = prepareChartData();
  const competitorNames = competitors.map(c => c.competitor_name);
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Competitive Intelligence</h1>
          <p className="text-muted-foreground">
            Monitor your competitors' ad activity and strategic moves
          </p>
        </div>
        <Link href="/dashboard/competitors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Track New Competitor
          </Button>
        </Link>
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
            <CardDescription>
              Stay updated on competitor movements
            </CardDescription>
          </div>
          {alerts.length > 0 && (
            <Link href="/dashboard/alerts">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <EmptyState
              title="No Alerts Yet"
              description="When competitors make significant moves, you'll see alerts here"
              icon={Bell}
            />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <Badge variant={getAlertVariant(alert.alert_type)} className="mt-1">
                    {getAlertIcon(alert.alert_type)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{alert.title}</p>
                    {alert.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(alert.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracked Competitors */}
      <Card>
        <CardHeader>
          <CardTitle>Tracked Competitors</CardTitle>
          <CardDescription>
            {competitors.length} competitor{competitors.length !== 1 ? 's' : ''} being monitored
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competitors.length === 0 ? (
            <EmptyState
              title="No Competitors Tracked"
              description="Start tracking competitors to monitor their ad campaigns and strategic moves"
              action={
                <Link href="/dashboard/competitors/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Track Your First Competitor
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {competitors.map((competitor) => (
                <Link
                  key={competitor.id}
                  href={`/dashboard/competitors/${competitor.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold">{competitor.competitor_name}</p>
                      {competitor.competitor_domain && (
                        <p className="text-sm text-muted-foreground">
                          {competitor.competitor_domain}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {competitor.last_checked && (
                        <span>
                          Last checked: {formatTimeAgo(competitor.last_checked)}
                        </span>
                      )}
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Competitive Landscape Chart */}
      {competitors.length > 0 && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Competitive Landscape (30 Days)</CardTitle>
            <CardDescription>
              Ad activity trends across tracked competitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => new Date(date as string).toLocaleDateString()}
                />
                <Legend />
                {competitorNames.map((name, index) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

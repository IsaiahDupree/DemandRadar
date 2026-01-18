import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';

/**
 * Admin Analytics Dashboard
 *
 * Internal dashboard for tracking:
 * - User signups and growth
 * - Report generation metrics
 * - Conversion funnel
 * - Usage patterns
 *
 * Access: Admin users only
 */
export default async function AnalyticsDashboardPage() {
  const supabase = await createClient();

  // Check if user is authenticated and admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // TODO: Add admin role check
  // For now, any authenticated user can access
  // In production, add: if (!user.app_metadata?.role === 'admin') redirect('/dashboard')

  // Fetch analytics data
  const [usersResult, runsResult, reportsResult, projectsResult] = await Promise.all([
    supabase.from('users').select('id, created_at', { count: 'exact' }),
    supabase.from('runs').select('id, status, created_at', { count: 'exact' }),
    supabase.from('reports').select('id, created_at', { count: 'exact' }),
    supabase.from('projects').select('id, created_at', { count: 'exact' }),
  ]);

  const totalUsers = usersResult.count || 0;
  const totalRuns = runsResult.count || 0;
  const totalReports = reportsResult.count || 0;
  const totalProjects = projectsResult.count || 0;

  // Calculate runs by status
  const runsByStatus =
    runsResult.data?.reduce(
      (acc, run) => {
        acc[run.status] = (acc[run.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ) || {};

  // Calculate users in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentUsers =
    usersResult.data?.filter((u) => new Date(u.created_at) >= thirtyDaysAgo).length || 0;

  const recentRuns =
    runsResult.data?.filter((r) => new Date(r.created_at) >= thirtyDaysAgo).length || 0;

  const recentReports =
    reportsResult.data?.filter((r) => new Date(r.created_at) >= thirtyDaysAgo).length || 0;

  // Calculate conversion metrics
  const conversionRate = totalUsers > 0 ? ((totalRuns / totalUsers) * 100).toFixed(1) : '0.0';

  const reportsPerRun = totalRuns > 0 ? (totalReports / totalRuns).toFixed(2) : '0.00';

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Internal metrics for tracking usage and conversion
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{recentUsers} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRuns}</div>
            <p className="text-xs text-muted-foreground mt-1">+{recentRuns} in last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reports Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalReports}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{recentReports} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Active workspaces</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Metrics</CardTitle>
            <CardDescription>User engagement and conversion rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Runs per User</span>
              <span className="text-xl font-bold">{conversionRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Reports per Run</span>
              <span className="text-xl font-bold">{reportsPerRun}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Run Status Breakdown</CardTitle>
            <CardDescription>Distribution of run statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(runsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-sm capitalize">{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
            {Object.keys(runsByStatus).length === 0 && (
              <p className="text-sm text-muted-foreground">No runs yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Section */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Overview</CardTitle>
          <CardDescription>Last 30 days activity summary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-sm">New Users</span>
            <span className="font-semibold">{recentUsers}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-sm">New Runs</span>
            <span className="font-semibold">{recentRuns}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-sm">Reports Generated</span>
            <span className="font-semibold">{recentReports}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Average Runs per User</span>
            <span className="font-semibold">
              {recentUsers > 0 ? (recentRuns / recentUsers).toFixed(2) : '0.00'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

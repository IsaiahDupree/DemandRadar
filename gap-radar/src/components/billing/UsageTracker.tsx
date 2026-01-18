"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

interface CreditsInfo {
  used: number;
  limit: number;
  remaining: number;
  plan?: string;
}

interface UsageTrackerProps {
  refreshTrigger?: number;
}

export default function UsageTracker({ refreshTrigger }: UsageTrackerProps) {
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, [refreshTrigger]);

  async function fetchCredits() {
    try {
      setLoading(true);
      setError(false);
      const response = await fetch('/api/billing/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function getUsagePercentage(): number {
    if (!credits || credits.limit === 0) return 0;
    return Math.round((credits.used / credits.limit) * 100);
  }

  function getUsageStatus(): 'healthy' | 'warning' | 'critical' {
    const percentage = getUsagePercentage();
    if (percentage >= 100) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'healthy';
  }

  function getStatusIcon() {
    const status = getUsageStatus();
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  }

  function getStatusBadge() {
    const status = getUsageStatus();
    switch (status) {
      case 'healthy':
        return <Badge variant="default">Good Standing</Badge>;
      case 'warning':
        return <Badge variant="secondary">Running Low</Badge>;
      case 'critical':
        return <Badge variant="destructive">Limit Reached</Badge>;
    }
  }

  function getPlanBadge() {
    if (!credits?.plan) return null;

    const planName = credits.plan.charAt(0).toUpperCase() + credits.plan.slice(1);
    return <Badge variant="outline">{planName}</Badge>;
  }

  return (
    <div data-testid="usage-tracker">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Usage Tracking
            </CardTitle>
            {getPlanBadge()}
          </div>
          <CardDescription>
            Monitor your monthly run usage and remaining credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
              <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Unable to load usage data
              </p>
            </div>
          ) : credits ? (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="font-medium">
                    {credits.used} / {credits.limit} runs
                  </span>
                </div>
                <Progress
                  value={getUsagePercentage()}
                  className="h-2"
                  aria-valuenow={getUsagePercentage()}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="progressbar"
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Used</p>
                  <p className="text-2xl font-bold">{credits.used}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold">{credits.remaining}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Limit</p>
                  <p className="text-2xl font-bold">{credits.limit}</p>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-accent/20">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="text-sm font-medium">
                    {credits.remaining} {credits.remaining === 1 ? 'run' : 'runs'} remaining
                  </span>
                </div>
                {getStatusBadge()}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

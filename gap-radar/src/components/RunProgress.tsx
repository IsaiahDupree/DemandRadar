'use client';

import { useRunStatus } from '@/hooks/use-run-status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

interface RunProgressProps {
  runId: string;
  enableRealtime?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  onComplete?: () => void;
}

export function RunProgress({
  runId,
  enableRealtime = true,
  showDetails = true,
  compact = false,
  onComplete
}: RunProgressProps) {
  const {
    run,
    loading,
    error,
    progressPercentage,
    estimatedTimeRemaining,
    isComplete,
    isFailed,
    isRunning,
    isQueued
  } = useRunStatus({ runId, enableRealtime });

  // Call onComplete callback when run finishes
  if (isComplete && onComplete) {
    onComplete();
  }

  if (loading) {
    return <RunProgressSkeleton compact={compact} />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!run) {
    return (
      <Alert>
        <AlertDescription>Run not found</AlertDescription>
      </Alert>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <RunStatusIcon status={run.status} />
        <div className="flex-1">
          <Progress value={progressPercentage} className="h-2" />
        </div>
        <Badge variant={getStatusVariant(run.status)} className="min-w-20 justify-center">
          {run.status}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RunStatusIcon status={run.status} />
              Analysis Progress
            </CardTitle>
            <CardDescription className="mt-1">
              {run.niche_query}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(run.status)} className="h-fit">
            {run.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {run.current_step || getStepFromStatus(run.status)}
            </span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Time Estimate */}
        {isRunning && estimatedTimeRemaining && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated time remaining: {estimatedTimeRemaining}</span>
          </div>
        )}

        {/* Details */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
            <div>
              <p className="text-muted-foreground">Started</p>
              <p className="font-medium">
                {run.started_at
                  ? new Date(run.started_at).toLocaleTimeString()
                  : 'Not started'}
              </p>
            </div>
            {(isComplete || isFailed) && run.finished_at && (
              <div>
                <p className="text-muted-foreground">Finished</p>
                <p className="font-medium">
                  {new Date(run.finished_at).toLocaleTimeString()}
                </p>
              </div>
            )}
            {(isComplete || isFailed) && run.started_at && run.finished_at && (
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {getDuration(run.started_at, run.finished_at)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {isFailed && run.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{run.error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {isComplete && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Analysis complete! Your report is ready.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function RunProgressSkeleton({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-2 flex-1" />
        <Skeleton className="h-6 w-20" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function RunStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'queued':
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case 'running':
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    case 'complete':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'queued':
      return 'secondary';
    case 'running':
      return 'default';
    case 'complete':
      return 'outline';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getStepFromStatus(status: string): string {
  switch (status) {
    case 'queued':
      return 'Waiting to start...';
    case 'running':
      return 'Processing data...';
    case 'complete':
      return 'Complete';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

function getDuration(startedAt: string, finishedAt: string): string {
  const duration = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes === 0) {
    return `${seconds} seconds`;
  }

  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes} minutes`;
}

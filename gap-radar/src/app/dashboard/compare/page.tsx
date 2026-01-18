"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockRuns } from "@/lib/mock-data";
import { Run } from "@/types";
import { X, CheckCircle2, Download, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function getStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">Complete</Badge>;
    case "running":
      return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-0">Running</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Queued</Badge>;
  }
}

function formatDuration(start?: Date, end?: Date) {
  if (!start) return "—";
  const endTime = end || new Date();
  const diff = endTime.getTime() - start.getTime();
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function getHighlightClass(value: number, allValues: number[], higherIsBetter: boolean = true): string {
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);

  if (higherIsBetter) {
    return value === max ? "bg-green-50 dark:bg-green-950 font-bold text-green-600 dark:text-green-400" : "";
  } else {
    return value === min ? "bg-green-50 dark:bg-green-950 font-bold text-green-600 dark:text-green-400" : "";
  }
}

function ComparePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(true);

  // Parse run IDs from URL params
  useEffect(() => {
    const runsParam = searchParams.get('runs');
    if (runsParam) {
      const ids = runsParam.split(',').filter(id => id.trim());
      setSelectedRunIds(prev => {
        // Only update if different to avoid infinite loop
        const prevStr = prev.sort().join(',');
        const newStr = ids.sort().join(',');
        return prevStr !== newStr ? ids : prev;
      });
      if (ids.length >= 2) {
        setIsSelecting(false);
      }
    }
  }, [searchParams]);

  // Get selected runs
  const selectedRuns = mockRuns.filter(run => selectedRunIds.includes(run.id));
  const completedRuns = mockRuns.filter(run => run.status === 'complete');

  const toggleRunSelection = (runId: string) => {
    setSelectedRunIds(prev => {
      if (prev.includes(runId)) {
        return prev.filter(id => id !== runId);
      } else {
        // Limit to 4 runs
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, runId];
      }
    });
  };

  const handleCompare = () => {
    if (selectedRunIds.length >= 2) {
      setIsSelecting(false);
      router.push(`/dashboard/compare?runs=${selectedRunIds.join(',')}`);
    }
  };

  const handleRemoveRun = (runId: string) => {
    const newIds = selectedRunIds.filter(id => id !== runId);
    setSelectedRunIds(newIds);
    if (newIds.length < 2) {
      setIsSelecting(true);
    }
    router.push(`/dashboard/compare?runs=${newIds.join(',')}`);
  };

  const handleAddMore = () => {
    setIsSelecting(true);
  };

  // Calculate metrics for highlighting
  const opportunityScores = selectedRuns.map(run => run.scores?.opportunity || 0);
  const confidenceScores = selectedRuns.map(run => run.scores?.confidence || 0);
  const saturationScores = selectedRuns.map(run => run.scores?.saturation || 0);
  const longevityScores = selectedRuns.map(run => run.scores?.longevity || 0);
  const dissatisfactionScores = selectedRuns.map(run => run.scores?.dissatisfaction || 0);

  if (isSelecting || selectedRunIds.length < 2) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Compare Runs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Select runs to compare side by side
          </p>
        </div>

        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Choose at least 2 runs to compare (maximum 4 runs)
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Select Runs to Compare</CardTitle>
            <CardDescription>
              {selectedRunIds.length} runs selected • {completedRuns.length} completed runs available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedRunIds.includes(run.id)}
                    onCheckedChange={() => toggleRunSelection(run.id)}
                    disabled={!selectedRunIds.includes(run.id) && selectedRunIds.length >= 4}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{run.nicheQuery}</p>
                    <p className="text-sm text-muted-foreground">
                      {run.seedTerms.slice(0, 3).join(", ")}
                      {run.seedTerms.length > 3 && ` +${run.seedTerms.length - 3} more`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {run.scores && (
                      <>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Opportunity</p>
                          <p className="font-medium">{run.scores.opportunity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Confidence</p>
                          <p className="font-medium">{Math.round(run.scores.confidence * 100)}%</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {completedRuns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No completed runs available to compare.</p>
                  <p className="text-sm mt-2">Complete at least 2 runs to use the comparison feature.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={handleCompare}
                disabled={selectedRunIds.length < 2}
                size="lg"
              >
                Compare {selectedRunIds.length > 0 && `(${selectedRunIds.length})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Comparison view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Compare Runs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {selectedRuns.length} runs selected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddMore} disabled={selectedRunIds.length >= 4}>
            <Plus className="mr-2 h-4 w-4" />
            Add Run
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto" role="region" aria-label="comparison">
        <div data-testid="comparison-view">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Metric</TableHead>
                {selectedRuns.map((run) => (
                  <TableHead key={run.id} className="text-center min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate flex-1">{run.nicheQuery}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-2"
                          onClick={() => handleRemoveRun(run.id)}
                          aria-label={`Remove ${run.nicheQuery}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {getStatusBadge(run.status)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Seed Terms */}
              <TableRow>
                <TableCell className="font-medium">Seed Terms</TableCell>
                {selectedRuns.map((run) => (
                  <TableCell key={run.id} className="text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {run.seedTerms.slice(0, 3).map((term, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {term}
                        </Badge>
                      ))}
                      {run.seedTerms.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{run.seedTerms.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Duration */}
              <TableRow>
                <TableCell className="font-medium">Duration / Time</TableCell>
                {selectedRuns.map((run) => (
                  <TableCell key={run.id} className="text-center">
                    {formatDuration(run.startedAt, run.finishedAt)}
                  </TableCell>
                ))}
              </TableRow>

              {/* Status */}
              <TableRow>
                <TableCell className="font-medium">Status</TableCell>
                {selectedRuns.map((run) => (
                  <TableCell key={run.id} className="text-center">
                    {run.status}
                  </TableCell>
                ))}
              </TableRow>

              {/* Opportunity Score */}
              <TableRow>
                <TableCell className="font-medium">Opportunity Score</TableCell>
                {selectedRuns.map((run, i) => (
                  <TableCell
                    key={run.id}
                    className={`text-center ${getHighlightClass(
                      run.scores?.opportunity || 0,
                      opportunityScores
                    )}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl font-bold">
                        {run.scores?.opportunity || '—'}
                      </span>
                      {run.scores?.opportunity && (
                        <Progress value={run.scores.opportunity} className="w-24 h-2" />
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Confidence */}
              <TableRow>
                <TableCell className="font-medium">Confidence</TableCell>
                {selectedRuns.map((run, i) => (
                  <TableCell
                    key={run.id}
                    className={`text-center ${getHighlightClass(
                      run.scores?.confidence || 0,
                      confidenceScores
                    )}`}
                  >
                    <span className="text-lg font-medium">
                      {run.scores ? `${Math.round(run.scores.confidence * 100)}%` : '—'}
                    </span>
                  </TableCell>
                ))}
              </TableRow>

              {/* Saturation */}
              <TableRow>
                <TableCell className="font-medium">Saturation</TableCell>
                {selectedRuns.map((run, i) => (
                  <TableCell
                    key={run.id}
                    className={`text-center ${getHighlightClass(
                      run.scores?.saturation || 0,
                      saturationScores,
                      false
                    )}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-lg font-medium">
                        {run.scores?.saturation || '—'}
                      </span>
                      {run.scores?.saturation && (
                        <Progress value={run.scores.saturation} className="w-24 h-2" />
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Longevity */}
              <TableRow>
                <TableCell className="font-medium">Longevity</TableCell>
                {selectedRuns.map((run, i) => (
                  <TableCell
                    key={run.id}
                    className={`text-center ${getHighlightClass(
                      run.scores?.longevity || 0,
                      longevityScores
                    )}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-lg font-medium">
                        {run.scores?.longevity || '—'}
                      </span>
                      {run.scores?.longevity && (
                        <Progress value={run.scores.longevity} className="w-24 h-2" />
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Dissatisfaction */}
              <TableRow>
                <TableCell className="font-medium">Dissatisfaction</TableCell>
                {selectedRuns.map((run, i) => (
                  <TableCell
                    key={run.id}
                    className={`text-center ${getHighlightClass(
                      run.scores?.dissatisfaction || 0,
                      dissatisfactionScores
                    )}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-lg font-medium">
                        {run.scores?.dissatisfaction || '—'}
                      </span>
                      {run.scores?.dissatisfaction && (
                        <Progress value={run.scores.dissatisfaction} className="w-24 h-2" />
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
      <ComparePageContent />
    </Suspense>
  );
}

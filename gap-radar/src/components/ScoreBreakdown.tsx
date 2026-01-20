/**
 * Score Breakdown Component
 * Feature: UDS-005
 *
 * Visual breakdown showing contribution from each signal
 * with bar charts, weights, and drill-down capability
 */

'use client';

import React, { useState } from 'react';
import type { UnifiedDemandResult } from '@/lib/scoring/unified-score';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ScoreBreakdownProps {
  result: UnifiedDemandResult;
  className?: string;
}

interface SignalInfo {
  key: keyof UnifiedDemandResult['breakdown'];
  label: string;
  description: string;
  color: string;
}

const SIGNAL_INFO: SignalInfo[] = [
  {
    key: 'pain_score',
    label: 'Pain Points',
    description: 'Reddit discussions and complaints',
    color: 'bg-red-500',
  },
  {
    key: 'spend_score',
    label: 'Ad Spend',
    description: 'Meta advertising signals',
    color: 'bg-blue-500',
  },
  {
    key: 'search_score',
    label: 'Search Demand',
    description: 'Google Trends volume',
    color: 'bg-green-500',
  },
  {
    key: 'content_score',
    label: 'Content Gaps',
    description: 'YouTube opportunities',
    color: 'bg-purple-500',
  },
  {
    key: 'app_score',
    label: 'App Market',
    description: 'App Store signals',
    color: 'bg-orange-500',
  },
];

export function ScoreBreakdown({ result, className }: ScoreBreakdownProps) {
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  const handleSignalClick = (signalKey: string) => {
    setExpandedSignal(expandedSignal === signalKey ? null : signalKey);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Demand Score</span>
          <span className="text-4xl font-bold">{result.unified_score}</span>
        </CardTitle>
        <CardDescription>
          Weighted score from 5 demand signals
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {SIGNAL_INFO.map((signal) => {
          const breakdown = result.breakdown[signal.key];
          const weightPercentage = Math.round(breakdown.weight * 100);
          const isExpanded = expandedSignal === signal.key;

          return (
            <div
              key={signal.key}
              className={cn(
                'space-y-2 rounded-lg border p-3 transition-colors cursor-pointer hover:bg-muted/50',
                isExpanded && 'bg-muted/50'
              )}
              onClick={() => handleSignalClick(signal.key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-3 w-3 rounded-full', signal.color)} />
                    <span className="font-medium">{signal.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {weightPercentage}%
                    </span>
                  </div>
                  {isExpanded && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {signal.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{breakdown.value}</div>
                  {isExpanded && (
                    <div className="text-xs text-muted-foreground">
                      contributes {breakdown.contribution.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>

              <Progress
                value={breakdown.value}
                className="h-2"
                role="progressbar"
                aria-label={`${signal.label} progress`}
                aria-valuenow={breakdown.value}
                aria-valuemin={0}
                aria-valuemax={100}
              />

              {isExpanded && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
                  <div>
                    <div className="text-muted-foreground">Score</div>
                    <div className="font-medium">{breakdown.value}/100</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Weight</div>
                    <div className="font-medium">{weightPercentage}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Impact</div>
                    <div className="font-medium">
                      {breakdown.contribution.toFixed(1)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Total Weighted Score</span>
            <span className="text-2xl font-bold text-foreground">
              {result.unified_score}/100
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

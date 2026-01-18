/**
 * Buildability Assessment Report Section
 *
 * Report Page 7: Displays implementation difficulty, time-to-MVP, human touch level,
 * and risk flags.
 *
 * @see PRD §8 - Report Structure (Buildability Assessment)
 * @see Feature RG-011
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Hammer, Clock, User, Bot } from 'lucide-react';

export type TouchLevel = 'low' | 'medium' | 'high';
export type MVPSize = 'S' | 'M' | 'L';
export type RiskSeverity = 'low' | 'medium' | 'high';
export type RiskType = 'legal' | 'compliance' | 'platform_policy' | 'market' | 'technical' | 'financial' | 'regulatory';

export interface RiskFlag {
  type: RiskType;
  severity: RiskSeverity;
  description: string;
}

export interface BuildabilityData {
  implementationDifficulty: number;
  buildDifficulty: number;
  distributionDifficulty: number;
  timeToMVP: MVPSize;
  humanTouchLevel: TouchLevel;
  autonomousSuitability: TouchLevel;
  riskFlags: RiskFlag[];
}

export interface BuildabilityAssessmentProps {
  buildability: BuildabilityData;
}

/**
 * Get color class for difficulty score
 */
function getDifficultyColor(score: number): string {
  if (score <= 30) return 'text-green-600 dark:text-green-400';
  if (score <= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get badge variant for severity
 */
function getSeverityVariant(severity: RiskSeverity): 'default' | 'secondary' | 'destructive' {
  switch (severity) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'default';
  }
}

/**
 * Get touch level badge variant
 */
function getTouchLevelVariant(level: TouchLevel): 'default' | 'secondary' | 'destructive' {
  switch (level) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'default';
  }
}

/**
 * Format touch level for display
 */
function formatTouchLevel(level: TouchLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/**
 * Format MVP size for display
 */
function formatMVPSize(size: MVPSize): string {
  switch (size) {
    case 'S':
      return 'Small (1-2 months)';
    case 'M':
      return 'Medium (3-6 months)';
    case 'L':
      return 'Large (6+ months)';
  }
}

/**
 * Format risk type for display
 */
function formatRiskType(type: RiskType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Buildability Assessment Component
 */
export function BuildabilityAssessment({ buildability }: BuildabilityAssessmentProps) {
  return (
    <div data-testid="buildability-assessment">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hammer className="h-5 w-5" />
            Buildability Assessment
          </CardTitle>
          <CardDescription>
            Technical complexity, timeline, and operational requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Difficulty Scores */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Difficulty Scores</h4>

            {/* Implementation Difficulty */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Implementation Difficulty</span>
                <span className={`text-sm font-semibold ${getDifficultyColor(buildability.implementationDifficulty)}`}>
                  {buildability.implementationDifficulty}
                </span>
              </div>
              <Progress value={buildability.implementationDifficulty} className="h-2" />
            </div>

            {/* Build Difficulty */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Build Difficulty</span>
                <span className={`text-sm font-semibold ${getDifficultyColor(buildability.buildDifficulty)}`}>
                  {buildability.buildDifficulty}
                </span>
              </div>
              <Progress value={buildability.buildDifficulty} className="h-2" />
            </div>

            {/* Distribution Difficulty */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Distribution Difficulty</span>
                <span className={`text-sm font-semibold ${getDifficultyColor(buildability.distributionDifficulty)}`}>
                  {buildability.distributionDifficulty}
                </span>
              </div>
              <Progress value={buildability.distributionDifficulty} className="h-2" />
            </div>
          </div>

          {/* Time to MVP */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <h4 className="text-sm font-semibold">Time to MVP</h4>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="text-lg font-semibold">{formatMVPSize(buildability.timeToMVP)}</div>
            </div>
          </div>

          {/* Human Touch & Autonomous Suitability */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <h4 className="text-sm font-semibold">Human Touch Required</h4>
              </div>
              <Badge variant={getTouchLevelVariant(buildability.humanTouchLevel)}>
                {formatTouchLevel(buildability.humanTouchLevel)}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <h4 className="text-sm font-semibold">Autonomous Suitability</h4>
              </div>
              <Badge variant={getTouchLevelVariant(buildability.autonomousSuitability === 'high' ? 'low' : buildability.autonomousSuitability === 'low' ? 'high' : 'medium')}>
                {formatTouchLevel(buildability.autonomousSuitability)}
              </Badge>
            </div>
          </div>

          {/* Risk Flags */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <h4 className="text-sm font-semibold">Risk Flags</h4>
            </div>

            {buildability.riskFlags.length === 0 ? (
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
                No risk flags identified
              </div>
            ) : (
              <div className="space-y-2">
                {buildability.riskFlags.map((risk, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityVariant(risk.severity)}>
                              {risk.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatRiskType(risk.type)}
                            </span>
                          </div>
                          <p className="text-sm">{risk.description}</p>
                        </div>
                        <AlertTriangle
                          className={`h-5 w-5 flex-shrink-0 ${
                            risk.severity === 'high'
                              ? 'text-red-600 dark:text-red-400'
                              : risk.severity === 'medium'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

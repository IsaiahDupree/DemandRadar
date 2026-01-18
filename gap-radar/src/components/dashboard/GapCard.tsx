"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GapOpportunity } from '@/types';
import { FileText, MessageSquare } from 'lucide-react';

interface GapCardProps {
  gap: GapOpportunity;
  onClick: (gap: GapOpportunity) => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-orange-600 bg-orange-50 border-orange-200';
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-blue-600';
  if (confidence >= 0.4) return 'text-yellow-600';
  return 'text-orange-600';
}

export function GapCard({ gap, onClick }: GapCardProps) {
  const confidencePercent = Math.round(gap.confidence * 100);
  const scoreColorClass = getScoreColor(gap.opportunityScore);
  const confidenceColorClass = getConfidenceColor(gap.confidence);

  return (
    <button
      onClick={() => onClick(gap)}
      className="w-full text-left transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
    >
      <Card className="h-full border-2 hover:border-primary/50 hover:shadow-lg transition-all">
        <CardContent className="p-6 space-y-4">
          {/* Header with Score and Type */}
          <div className="flex items-start justify-between gap-3">
            <div className={`flex items-center justify-center min-w-[60px] h-[60px] rounded-lg border-2 font-bold text-2xl ${scoreColorClass}`}>
              {gap.opportunityScore}
            </div>
            <Badge variant="outline" className="capitalize">
              {gap.gapType}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg leading-tight">
            {gap.title}
          </h3>

          {/* Problem Description */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {gap.problem}
          </p>

          {/* Evidence Sources */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Ads:</span>
              <span className="font-medium">{gap.evidenceAds.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Reddit:</span>
              <span className="font-medium">{gap.evidenceReddit.length}</span>
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Confidence</span>
            <span className={`text-sm font-semibold ${confidenceColorClass}`}>
              {confidencePercent}%
            </span>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

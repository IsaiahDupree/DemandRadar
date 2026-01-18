"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GapOpportunity } from '@/types';
import { EvidenceSection } from './EvidenceSection';
import { X, TrendingUp, Target } from 'lucide-react';

interface DetailModalProps {
  gap: GapOpportunity;
  isOpen: boolean;
  onClose: () => void;
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

export function DetailModal({ gap, isOpen, onClose }: DetailModalProps) {
  const confidencePercent = Math.round(gap.confidence * 100);
  const scoreColorClass = getScoreColor(gap.opportunityScore);
  const confidenceColorClass = getConfidenceColor(gap.confidence);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="capitalize">
                  {gap.gapType}
                </Badge>
                <div className="flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Opportunity Score:</span>
                  <span className={`text-sm font-bold ${scoreColorClass.split(' ')[0]}`}>
                    {gap.opportunityScore}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <span className={`text-sm font-semibold ${confidenceColorClass}`}>
                    {confidencePercent}%
                  </span>
                </div>
              </div>
              <DialogTitle className="text-2xl">{gap.title}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Problem Statement */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Problem</h3>
            <p className="text-muted-foreground leading-relaxed">{gap.problem}</p>
          </div>

          {/* Recommendation */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Recommendation
            </h3>
            <p className="leading-relaxed">{gap.recommendation}</p>
          </div>

          {/* Evidence Sections */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Evidence</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <EvidenceSection type="ads" evidence={gap.evidenceAds} />
              <EvidenceSection type="reddit" evidence={gap.evidenceReddit} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

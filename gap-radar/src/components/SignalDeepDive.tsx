/**
 * Signal Deep Dive Modal Component
 * Feature: UDS-006
 *
 * Modal showing supporting data for each signal
 * including sources, evidence, and detailed metrics
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

type SignalType = 'pain_score' | 'spend_score' | 'search_score' | 'content_score' | 'app_score';

interface PainEvidence {
  text: string;
  votes: number;
  source: string;
}

interface SearchEvidence {
  keyword: string;
  volume: number;
  trend: 'rising' | 'stable' | 'declining';
}

interface SpendEvidence {
  advertiser: string;
  creative: string;
  runTime: number;
}

interface ContentEvidence {
  title: string;
  views: number;
  gap: string;
}

interface AppEvidence {
  appName: string;
  rating: number;
  complaint: string;
}

type Evidence = PainEvidence | SearchEvidence | SpendEvidence | ContentEvidence | AppEvidence;

interface SignalData {
  signal: SignalType;
  signalName: string;
  score: number;
  data: {
    sources: string[];
    evidence: Evidence[];
  };
}

interface SignalDeepDiveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signalData: SignalData | null;
}

function isPainEvidence(evidence: Evidence): evidence is PainEvidence {
  return 'votes' in evidence && 'text' in evidence;
}

function isSearchEvidence(evidence: Evidence): evidence is SearchEvidence {
  return 'keyword' in evidence && 'volume' in evidence;
}

function isSpendEvidence(evidence: Evidence): evidence is SpendEvidence {
  return 'advertiser' in evidence && 'creative' in evidence;
}

function isContentEvidence(evidence: Evidence): evidence is ContentEvidence {
  return 'title' in evidence && 'views' in evidence;
}

function isAppEvidence(evidence: Evidence): evidence is AppEvidence {
  return 'appName' in evidence && 'rating' in evidence;
}

export function SignalDeepDive({ open, onOpenChange, signalData }: SignalDeepDiveProps) {
  if (!signalData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signal Data</DialogTitle>
            <DialogDescription>No data available</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const { signalName, score, data } = signalData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{signalName}</span>
            <span className="text-3xl font-bold">{score}</span>
          </DialogTitle>
          <DialogDescription>
            Supporting data and evidence for this signal
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Sources Section */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Data Sources</h3>
              <div className="flex flex-wrap gap-2">
                {data.sources.map((source, index) => (
                  <Badge key={index} variant="secondary">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Evidence Section */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Evidence</h3>
              <div className="space-y-3">
                {data.evidence.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      {isPainEvidence(item) && (
                        <div className="space-y-2">
                          <p className="text-sm">{item.text}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{item.votes} upvotes</span>
                            <span>{item.source}</span>
                          </div>
                        </div>
                      )}

                      {isSearchEvidence(item) && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.keyword}</span>
                            <Badge variant={item.trend === 'rising' ? 'default' : 'secondary'}>
                              {item.trend}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.volume} monthly searches
                          </div>
                        </div>
                      )}

                      {isSpendEvidence(item) && (
                        <div className="space-y-2">
                          <p className="font-medium">{item.advertiser}</p>
                          <p className="text-sm">{item.creative}</p>
                          <div className="text-xs text-muted-foreground">
                            Running for {item.runTime} days
                          </div>
                        </div>
                      )}

                      {isContentEvidence(item) && (
                        <div className="space-y-2">
                          <p className="font-medium">{item.title}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{item.views.toLocaleString()} views</span>
                            <span>Gap: {item.gap}</span>
                          </div>
                        </div>
                      )}

                      {isAppEvidence(item) && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.appName}</span>
                            <span className="text-sm">{item.rating} ⭐</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.complaint}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

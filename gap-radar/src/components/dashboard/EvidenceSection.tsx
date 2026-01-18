"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, AlertCircle } from 'lucide-react';

interface EvidenceItem {
  id: string;
  snippet: string;
}

interface EvidenceSectionProps {
  type: 'ads' | 'reddit';
  evidence: EvidenceItem[];
}

export function EvidenceSection({ type, evidence }: EvidenceSectionProps) {
  const Icon = type === 'ads' ? FileText : MessageSquare;
  const title = type === 'ads' ? 'Ad Evidence' : 'Reddit Evidence';
  const colorClass = type === 'ads' ? 'text-blue-600' : 'text-orange-600';

  if (evidence.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${colorClass}`} />
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="secondary">0</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">No evidence available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Limit to 10 evidence items for display
  const displayedEvidence = evidence.slice(0, 10);
  const hasMore = evidence.length > 10;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${colorClass}`} />
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant="secondary">{evidence.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedEvidence.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg border bg-muted/30 text-sm"
            >
              <p className="leading-relaxed">{item.snippet}</p>
            </div>
          ))}
          {hasMore && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              +{evidence.length - 10} more evidence items
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

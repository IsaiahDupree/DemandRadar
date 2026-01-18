"use client";

import React from 'react';
import { GapOpportunity } from '@/types';
import { GapCard } from './GapCard';
import { SearchX } from 'lucide-react';

interface ResultsGridProps {
  gaps: GapOpportunity[];
  onGapClick: (gap: GapOpportunity) => void;
}

export function ResultsGrid({ gaps, onGapClick }: ResultsGridProps) {
  if (gaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No gap opportunities found</h3>
        <p className="text-muted-foreground max-w-md">
          Try adjusting your filters or run a new analysis to discover market gaps.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="results-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {gaps.map((gap) => (
        <GapCard key={gap.id} gap={gap} onClick={onGapClick} />
      ))}
    </div>
  );
}

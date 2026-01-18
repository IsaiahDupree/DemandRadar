"use client";

import React from 'react';
import { AdCreative } from '@/types';
import { AdCard } from './AdCard';

interface AdGridProps {
  ads: AdCreative[];
  onAdClick: (ad: AdCreative) => void;
  isLoading?: boolean;
}

function AdGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="ad-grid-skeleton">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="flex justify-between pt-2 border-t">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdGrid({ ads, onAdClick, isLoading = false }: AdGridProps) {
  if (isLoading) {
    return <AdGridSkeleton />;
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      data-testid="ad-grid"
    >
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} onClick={onAdClick} />
      ))}
    </div>
  );
}

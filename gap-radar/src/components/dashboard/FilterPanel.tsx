"use client";

import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

export interface FilterState {
  categories: string[];
  scoreRange: [number, number];
  sources: string[];
  sentiments: string[];
}

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

const CATEGORIES = [
  { value: 'product', label: 'Product' },
  { value: 'offer', label: 'Offer' },
  { value: 'positioning', label: 'Positioning' },
  { value: 'trust', label: 'Trust' },
  { value: 'pricing', label: 'Pricing' },
];

const SOURCES = [
  { value: 'meta', label: 'Meta Ads' },
  { value: 'google', label: 'Google Ads' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'appstore', label: 'App Store' },
];

const SENTIMENTS = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

export function FilterPanel({ onFilterChange, initialFilters }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    categories: initialFilters?.categories || [],
    scoreRange: initialFilters?.scoreRange || [0, 100],
    sources: initialFilters?.sources || [],
    sentiments: initialFilters?.sentiments || [],
  });

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilters({ categories: newCategories });
  };

  const toggleSource = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source];
    updateFilters({ sources: newSources });
  };

  const toggleSentiment = (sentiment: string) => {
    const newSentiments = filters.sentiments.includes(sentiment)
      ? filters.sentiments.filter(s => s !== sentiment)
      : [...filters.sentiments, sentiment];
    updateFilters({ sentiments: newSentiments });
  };

  const handleScoreRangeChange = (value: number[]) => {
    updateFilters({ scoreRange: [value[0], value[1]] });
  };

  const clearAll = () => {
    const defaultFilters: FilterState = {
      categories: [],
      scoreRange: [0, 100],
      sources: [],
      sentiments: [],
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const activeFilterCount =
    filters.categories.length +
    filters.sources.length +
    filters.sentiments.length +
    (filters.scoreRange[0] !== 0 || filters.scoreRange[1] !== 100 ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <Accordion type="multiple" className="w-full" defaultValue={["category"]}>
        <AccordionItem value="category">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              Category
              {filters.categories.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {filters.categories.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {CATEGORIES.map((category) => (
                <div key={category.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.value}`}
                    checked={filters.categories.includes(category.value)}
                    onCheckedChange={() => toggleCategory(category.value)}
                  />
                  <Label
                    htmlFor={`category-${category.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="score">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              Score Range
              {(filters.scoreRange[0] !== 0 || filters.scoreRange[1] !== 100) && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {filters.scoreRange[0]}-{filters.scoreRange[1]}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <Slider
                min={0}
                max={100}
                step={1}
                value={filters.scoreRange}
                onValueChange={handleScoreRangeChange}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{filters.scoreRange[0]}</span>
                <span>{filters.scoreRange[1]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="source">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              Source
              {filters.sources.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {filters.sources.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {SOURCES.map((source) => (
                <div key={source.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`source-${source.value}`}
                    checked={filters.sources.includes(source.value)}
                    onCheckedChange={() => toggleSource(source.value)}
                  />
                  <Label
                    htmlFor={`source-${source.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {source.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sentiment">
          <AccordionTrigger className="text-sm font-medium">
            <div className="flex items-center gap-2">
              Sentiment
              {filters.sentiments.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {filters.sentiments.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {SENTIMENTS.map((sentiment) => (
                <div key={sentiment.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sentiment-${sentiment.value}`}
                    checked={filters.sentiments.includes(sentiment.value)}
                    onCheckedChange={() => toggleSentiment(sentiment.value)}
                  />
                  <Label
                    htmlFor={`sentiment-${sentiment.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {sentiment.label}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

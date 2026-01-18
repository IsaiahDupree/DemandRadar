"use client";

import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export interface Filter {
  id: string;
  label: string;
  value: string;
}

interface SearchWithFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: Filter[]) => void;
  filters?: Filter[];
  placeholder?: string;
  initialQuery?: string;
}

export function SearchWithFilters({
  onSearch,
  onFilterChange,
  filters = [],
  placeholder = "Search gaps, niches, or keywords...",
  initialQuery = "",
}: SearchWithFiltersProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSearch = () => {
    onSearch(query);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRemoveFilter = (filterId: string) => {
    const updatedFilters = filters.filter(f => f.id !== filterId);
    onFilterChange(updatedFilters);
  };

  const handleClearAll = () => {
    onFilterChange([]);
  };

  const activeFilterCount = filters.length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} aria-label="Search">
          Search
        </Button>
      </div>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'}
          </span>

          {filters.map((filter) => (
            <div
              key={filter.id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
            >
              <span className="font-medium">{filter.label}:</span>
              <span>{filter.value}</span>
              <button
                onClick={() => handleRemoveFilter(filter.id)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                aria-label={`Remove filter ${filter.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

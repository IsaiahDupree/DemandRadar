'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackTrendClick } from '@/lib/analytics/landing';

interface TrendingTopic {
  id: string;
  topic: string;
  category: string;
  volume: number;
  growth: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sources: string[];
  relatedTerms: string[];
  opportunityScore: number;
}

interface TrendsResponse {
  trends: TrendingTopic[];
  lastUpdated: string;
  sources: string[];
}

export function TrendingTopics({ onTopicClick }: { onTopicClick?: (topic: string) => void }) {
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    async function fetchTrends() {
      try {
        const response = await fetch('/api/trends');
        const data: TrendsResponse = await response.json();
        setTrends(data.trends || []);
        setLastUpdated(data.lastUpdated || '');
      } catch (error) {
        console.error('Error fetching trends:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getOpportunityColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-5 animate-pulse">
            <div className="h-5 bg-muted rounded w-3/4 mb-3" />
            <div className="h-4 bg-muted rounded w-1/2 mb-4" />
            <div className="flex gap-2">
              <div className="h-6 bg-muted rounded w-16" />
              <div className="h-6 bg-muted rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            Live data from Reddit, ProductHunt & more
          </span>
        </div>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Updated {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((trend) => (
          <div
            key={trend.id}
            onClick={() => {
              trackTrendClick(trend.topic, trend.category, trend.opportunityScore);
              onTopicClick?.(trend.topic);
            }}
            className={cn(
              "bg-card border rounded-xl p-5 hover:border-primary/50 transition-all cursor-pointer group",
              "hover:shadow-lg hover:-translate-y-1"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                {trend.topic}
              </h3>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {getSentimentIcon(trend.sentiment)}
                <span className="text-xs text-muted-foreground">
                  {trend.growth > 0 ? '+' : ''}{Math.round(trend.growth)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-1 bg-muted rounded-full">
                {trend.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {trend.volume.toLocaleString()} mentions
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", getOpportunityColor(trend.opportunityScore))}
                  style={{ width: `${trend.opportunityScore}%` }}
                />
              </div>
              <span className="text-sm font-medium">{trend.opportunityScore}</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {trend.relatedTerms.slice(0, 3).map((term) => (
                <span
                  key={term}
                  className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded"
                >
                  {term}
                </span>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <div className="flex gap-1">
                {trend.sources.slice(0, 2).map((source) => (
                  <span key={source} className="text-xs text-muted-foreground">
                    {source}
                  </span>
                ))}
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

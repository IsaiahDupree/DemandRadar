"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Bookmark, Download, ArrowRight, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface SavedGap {
  saved_id: string;
  saved_at: string;
  id: string;
  title: string;
  gap_type: string;
  problem: string;
  recommendation: string;
  opportunity_score: number;
  confidence: number;
  evidence_ads: any[];
  evidence_reddit: any[];
}

function getGapTypeBadge(type: string) {
  const typeColors = {
    product: "bg-blue-500/10 text-blue-600",
    offer: "bg-green-500/10 text-green-600",
    positioning: "bg-purple-500/10 text-purple-600",
    trust: "bg-yellow-500/10 text-yellow-600",
    pricing: "bg-red-500/10 text-red-600",
  };
  const color = typeColors[type as keyof typeof typeColors] || "bg-gray-500/10 text-gray-600";
  return (
    <Badge className={`${color} border-0`}>
      {type}
    </Badge>
  );
}

export default function SavedGapsPage() {
  const [savedGaps, setSavedGaps] = useState<SavedGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedGaps();
  }, []);

  async function fetchSavedGaps() {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('user_saved_gaps')
        .select('*')
        .order('saved_at', { ascending: false });

      if (error) throw error;

      setSavedGaps(data || []);
    } catch (error) {
      console.error('Error fetching saved gaps:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(gapId: string, savedId: string) {
    setRemovingId(savedId);
    
    try {
      const response = await fetch(`/api/gaps/${gapId}/save`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove gap');
      }

      setSavedGaps(prev => prev.filter(gap => gap.saved_id !== savedId));
    } catch (error) {
      console.error('Error removing gap:', error);
      alert('Failed to remove gap from saved list');
    } finally {
      setRemovingId(null);
    }
  }

  async function handleExport() {
    const csvContent = [
      ['Title', 'Type', 'Opportunity Score', 'Confidence', 'Problem', 'Recommendation', 'Saved At'],
      ...savedGaps.map(gap => [
        gap.title,
        gap.gap_type,
        gap.opportunity_score?.toString() || '',
        gap.confidence?.toString() || '',
        gap.problem,
        gap.recommendation,
        new Date(gap.saved_at).toLocaleDateString(),
      ])
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saved-gaps-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Saved Gaps</h1>
          <p className="text-muted-foreground">
            Your bookmarked gap opportunities for future reference
          </p>
        </div>
        {savedGaps.length > 0 && (
          <Button 
            onClick={handleExport}
            variant="outline"
            data-testid="export-saved-gaps"
          >
            <Download className="mr-2 h-4 w-4" />
            Export List
          </Button>
        )}
      </div>

      {savedGaps.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bookmark className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No saved gaps yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Start exploring gap opportunities and bookmark the ones you want to reference later.
            </p>
            <Link href="/dashboard/gaps">
              <Button>
                Discover Gaps
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="saved-gaps-container">
          {savedGaps.map((gap) => (
            <Card key={gap.saved_id} data-testid="gap-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getGapTypeBadge(gap.gap_type)}
                      <span 
                        className="text-sm text-muted-foreground"
                        data-testid="gap-score"
                      >
                        Score: {gap.opportunity_score?.toFixed(0) || 'N/A'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Saved {new Date(gap.saved_at).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle 
                      className="text-xl mb-2"
                      data-testid="gap-title"
                    >
                      {gap.title}
                    </CardTitle>
                    <CardDescription data-testid="gap-type">
                      {gap.problem}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(gap.id, gap.saved_id)}
                    disabled={removingId === gap.saved_id}
                    data-testid="remove-from-saved"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Recommendation</h4>
                    <p className="text-sm text-muted-foreground">
                      {gap.recommendation}
                    </p>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Evidence from Ads:</span> {gap.evidence_ads?.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Evidence from Reddit:</span> {gap.evidence_reddit?.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span> {gap.confidence ? `${(gap.confidence * 100).toFixed(0)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {savedGaps.length > 0 && (
        <div className="mt-8 text-center">
          <Link href="/dashboard/gaps">
            <Button variant="outline">
              View All Gaps
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

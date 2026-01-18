"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { Star, BookOpen, Trophy, Target, Copy, ExternalLink, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AdStrategy {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  framework: string;
  example_script?: string;
  when_to_use?: string;
  effectiveness_score: number;
  difficulty: string;
  icon?: string;
  times_used: number;
}

interface WinningAd {
  id: string;
  brand_name: string;
  niche: string;
  platform: string;
  hook: string;
  promise?: string;
  cta?: string;
  ad_format: string;
  strategy_used?: string;
  why_it_works?: string;
  is_featured: boolean;
  thumbnail_url?: string;
}

interface NichePlaybook {
  id: string;
  niche: string;
  niche_display_name: string;
  description: string;
  market_size: string;
  competition_level: string;
  growth_trend: string;
  target_audience?: string;
  pain_points?: string[];
  top_strategies?: string[];
}

export default function ExpertPicksPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<AdStrategy[]>([]);
  const [winningAds, setWinningAds] = useState<WinningAd[]>([]);
  const [playbooks, setPlaybooks] = useState<NichePlaybook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("strategies");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    try {
      const supabase = createClient();

      // Fetch ad strategies
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('ad_strategies')
        .select('*')
        .order('effectiveness_score', { ascending: false })
        .limit(20);

      if (strategiesError) throw strategiesError;
      setStrategies(strategiesData || []);

      // Fetch winning ads (featured only)
      const { data: adsData, error: adsError } = await supabase
        .from('winning_ads_library')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (adsError) throw adsError;
      setWinningAds(adsData || []);

      // Fetch niche playbooks
      const { data: playbooksData, error: playbooksError } = await supabase
        .from('niche_playbooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (playbooksError) throw playbooksError;
      setPlaybooks(playbooksData || []);

    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to load expert picks');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyFramework(framework: string, name: string) {
    navigator.clipboard.writeText(framework);
    toast.success(`Copied "${name}" framework to clipboard`);
  }

  function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'advanced':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  }

  function getGrowthColor(trend: string) {
    switch (trend) {
      case 'emerging':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'growing':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'mature':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'declining':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  }

  const categories = ['all', 'hook', 'formula', 'format'];
  const filteredStrategies = categoryFilter === 'all'
    ? strategies
    : strategies.filter(s => s.category === categoryFilter);

  const hasAnyData = strategies.length > 0 || winningAds.length > 0 || playbooks.length > 0;

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Skeleton className="h-12 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" role="status" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Expert Picks</h1>
        <p className="text-muted-foreground">
          Curated collections of winning strategies, proven ads, and niche playbooks
        </p>
      </div>

      {!hasAnyData ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No expert picks available yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              We're building our library of curated strategies and winning examples
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="strategies">
              <Trophy className="mr-2 h-4 w-4" />
              Ad Strategies
            </TabsTrigger>
            <TabsTrigger value="winning-ads">
              <Star className="mr-2 h-4 w-4" />
              Winning Ads
            </TabsTrigger>
            <TabsTrigger value="playbooks">
              <BookOpen className="mr-2 h-4 w-4" />
              Niche Playbooks
            </TabsTrigger>
          </TabsList>

          {/* Ad Strategies Tab */}
          <TabsContent value="strategies" className="space-y-6">
            {/* Category Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filter:</span>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStrategies.map((strategy) => (
                <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {strategy.icon && (
                          <span className="text-2xl">{strategy.icon}</span>
                        )}
                        <Badge variant="outline">{strategy.category}</Badge>
                      </div>
                      <Badge className={getDifficultyColor(strategy.difficulty)}>
                        {strategy.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <CardDescription>{strategy.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-3 rounded-md text-sm">
                      {strategy.framework}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>Score: {strategy.effectiveness_score}/10</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>{strategy.times_used} uses</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCopyFramework(strategy.framework, strategy.name)}
                      >
                        <Copy className="mr-2 h-3 w-3" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/strategy-library/${strategy.slug}`)}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Winning Ads Tab */}
          <TabsContent value="winning-ads" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {winningAds.map((ad) => (
                <Card key={ad.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{ad.niche}</Badge>
                      <Badge variant="outline">{ad.platform}</Badge>
                    </div>
                    <CardTitle className="text-lg">{ad.brand_name}</CardTitle>
                    <Badge className="w-fit">{ad.ad_format}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Hook:</p>
                      <p className="text-sm text-muted-foreground">{ad.hook}</p>
                    </div>

                    {ad.why_it_works && (
                      <div className="bg-green-500/10 p-3 rounded-md">
                        <p className="text-xs font-medium text-green-600 mb-1">Why it works:</p>
                        <p className="text-xs text-green-600">{ad.why_it_works}</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleCopyFramework(ad.hook, ad.brand_name)}
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      Copy Hook
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Niche Playbooks Tab */}
          <TabsContent value="playbooks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {playbooks.map((playbook) => (
                <Card key={playbook.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getGrowthColor(playbook.growth_trend)}>
                        {playbook.growth_trend}
                      </Badge>
                      <Badge variant="outline">{playbook.market_size}</Badge>
                    </div>
                    <CardTitle>{playbook.niche_display_name}</CardTitle>
                    <CardDescription>{playbook.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Market Size</p>
                        <p className="font-medium">{playbook.market_size}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Competition</p>
                        <p className="font-medium capitalize">{playbook.competition_level}</p>
                      </div>
                    </div>

                    {playbook.pain_points && playbook.pain_points.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Top Pain Points:</p>
                        <ul className="space-y-1">
                          {playbook.pain_points.slice(0, 3).map((pain, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{pain}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/niches/${playbook.niche}`)}
                    >
                      <BookOpen className="mr-2 h-3 w-3" />
                      View Full Playbook
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

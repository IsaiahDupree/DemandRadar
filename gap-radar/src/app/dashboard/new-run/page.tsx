"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  X,
  Zap,
  Clock,
  Globe,
  Smartphone,
  MonitorSmartphone,
  MessageSquare,
  ShoppingBag,
  Video,
  Play,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { trackFirstRunStarted, hasCompletedStage, markStageCompleted } from "@/lib/analytics/funnel";
import { FavoriteSearches } from "@/components/FavoriteSearches";
import { addFavoriteSearch, removeFavoriteSearch, getFavoriteSearchByQuery } from "@/lib/favorites";

const dataSources = [
  { id: "meta", name: "Meta Ads Library", icon: ShoppingBag, description: "Facebook & Instagram ads" },
  { id: "google", name: "Google Ads", icon: Globe, description: "Google Transparency Center" },
  { id: "reddit", name: "Reddit", icon: MessageSquare, description: "User discussions & sentiment" },
  { id: "ios", name: "iOS App Store", icon: Smartphone, description: "iPhone app discovery" },
  { id: "android", name: "Play Store", icon: MonitorSmartphone, description: "Android app discovery" },
  { id: "tiktok", name: "TikTok", icon: Video, description: "UGC & trend analysis" },
];

export default function NewRunPage() {
  const router = useRouter();
  const [nicheQuery, setNicheQuery] = useState("");
  const [seedTerms, setSeedTerms] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newSeedTerm, setNewSeedTerm] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>(["meta", "google", "reddit"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runType, setRunType] = useState("deep");
  const [geo, setGeo] = useState("us");
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isFavoritingPending, setIsFavoritingPending] = useState(false);

  // Check if this is the user's first run
  useEffect(() => {
    setIsFirstRun(!hasCompletedStage('first_run_started'));
  }, []);

  // Check if current query is favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!nicheQuery.trim()) {
        setIsFavorited(false);
        setFavoriteId(null);
        return;
      }

      try {
        const favorite = await getFavoriteSearchByQuery(nicheQuery.trim());
        setIsFavorited(!!favorite);
        setFavoriteId(favorite?.id || null);
      } catch (error) {
        // Silently fail - not critical
        console.error('Error checking favorite status:', error);
      }
    };

    const debounce = setTimeout(checkFavoriteStatus, 300);
    return () => clearTimeout(debounce);
  }, [nicheQuery]);

  const addSeedTerm = () => {
    if (newSeedTerm && !seedTerms.includes(newSeedTerm)) {
      setSeedTerms([...seedTerms, newSeedTerm]);
      setNewSeedTerm("");
    }
  };

  const removeSeedTerm = (term: string) => {
    setSeedTerms(seedTerms.filter((t) => t !== term));
  };

  const addCompetitor = () => {
    if (newCompetitor && !competitors.includes(newCompetitor)) {
      setCompetitors([...competitors, newCompetitor]);
      setNewCompetitor("");
    }
  };

  const removeCompetitor = (comp: string) => {
    setCompetitors(competitors.filter((c) => c !== comp));
  };

  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      setSelectedSources(selectedSources.filter((s) => s !== sourceId));
    } else {
      setSelectedSources([...selectedSources, sourceId]);
    }
  };

  const handleToggleFavorite = async () => {
    if (!nicheQuery.trim()) {
      toast.error("Enter a search query first");
      return;
    }

    setIsFavoritingPending(true);

    try {
      if (isFavorited && favoriteId) {
        await removeFavoriteSearch(favoriteId);
        setIsFavorited(false);
        setFavoriteId(null);
        toast.success("Removed from favorites");
      } else {
        const favorite = await addFavoriteSearch(nicheQuery.trim());
        setIsFavorited(true);
        setFavoriteId(favorite.id);
        toast.success("Added to favorites");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update favorites');
    } finally {
      setIsFavoritingPending(false);
    }
  };

  const handleSelectFavorite = (query: string) => {
    setNicheQuery(query);
    toast.info(`Loaded: "${query}"`);
  };

  const handleSubmit = async () => {
    if (!nicheQuery) {
      toast.error("Please enter a niche to analyze");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nicheQuery,
          seedTerms,
          competitors,
          geo,
          runType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      // Track first run if applicable
      if (isFirstRun) {
        trackFirstRunStarted(data.runId || data.id, nicheQuery);
        markStageCompleted('first_run_started');
      }

      toast.success("Analysis started!", {
        description: `Analyzing "${nicheQuery}" - this may take ${runType === 'deep' ? '8-12' : '3-5'} minutes`,
      });

      router.push("/dashboard/runs");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start analysis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedTime = runType === "deep" ? "8-12 minutes" : "3-5 minutes";
  const estimatedCost = runType === "deep" ? "$3.50 - $5.00" : "$1.00 - $2.00";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Analysis</h1>
        <p className="text-muted-foreground">
          Start a market gap analysis for any niche
        </p>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Setup</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          {/* Niche Query */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Niche to Analyze
              </CardTitle>
              <CardDescription>
                Enter the market niche or product category you want to analyze
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="niche">Niche Query</Label>
                  <div className="flex gap-2">
                    <Input
                      id="niche"
                      placeholder="e.g., AI watermark remover, personal CRM app, meditation app..."
                      value={nicheQuery}
                      onChange={(e) => setNicheQuery(e.target.value)}
                      className="text-lg flex-1"
                    />
                    <Button
                      variant={isFavorited ? "default" : "outline"}
                      size="icon"
                      onClick={handleToggleFavorite}
                      disabled={isFavoritingPending || !nicheQuery.trim()}
                      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                      data-testid="favorite-button"
                    >
                      <Star
                        className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`}
                      />
                    </Button>
                  </div>
                </div>

                {/* Favorite Searches Dropdown */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <FavoriteSearches onSelectSearch={handleSelectFavorite} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
              <CardDescription>
                Select which platforms to pull market data from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dataSources.map((source) => (
                  <div
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSources.includes(source.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <source.icon className={`h-5 w-5 ${
                      selectedSources.includes(source.id) 
                        ? "text-primary" 
                        : "text-muted-foreground"
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{source.name}</p>
                      <p className="text-xs text-muted-foreground">{source.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Run Type */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Depth</CardTitle>
              <CardDescription>
                Choose between a quick overview or comprehensive analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  onClick={() => setRunType("light")}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    runType === "light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold">Light Run</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Quick market snapshot with top gaps and platform recommendation
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 3-5 min
                    </span>
                    <span>$1-2 per run</span>
                  </div>
                </div>
                <div
                  onClick={() => setRunType("deep")}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    runType === "deep"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">Deep Run</span>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Full dossier with vetted ideas, UGC playbook, and CAC/TAM models
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 8-12 min
                    </span>
                    <span>$3-5 per run</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          {/* Seed Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Seed Keywords</CardTitle>
              <CardDescription>
                Add related keywords to expand the search (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword..."
                    value={newSeedTerm}
                    onChange={(e) => setNewSeedTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSeedTerm()}
                  />
                  <Button onClick={addSeedTerm} variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {seedTerms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {seedTerms.map((term) => (
                      <Badge key={term} variant="secondary" className="gap-1">
                        {term}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeSeedTerm(term)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Competitors */}
          <Card>
            <CardHeader>
              <CardTitle>Known Competitors</CardTitle>
              <CardDescription>
                Add competitor brands, apps, or websites to analyze (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add competitor..."
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                  />
                  <Button onClick={addCompetitor} variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {competitors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {competitors.map((comp) => (
                      <Badge key={comp} variant="secondary" className="gap-1">
                        {comp}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeCompetitor(comp)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Geography */}
          <Card>
            <CardHeader>
              <CardTitle>Target Geography</CardTitle>
              <CardDescription>
                Select the primary market region for the analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={geo} onValueChange={setGeo}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="eu">European Union</SelectItem>
                  <SelectItem value="au">Australia</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary & Submit */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estimated</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {estimatedTime}
                </span>
                <span className="text-sm text-muted-foreground">
                  Cost: {estimatedCost}
                </span>
              </div>
            </div>
            <Button size="lg" onClick={handleSubmit} disabled={!nicheQuery || isSubmitting}>
              {isSubmitting ? (
                <Clock className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? "Starting..." : "Start Analysis"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

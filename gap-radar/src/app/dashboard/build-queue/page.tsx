"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BuildRecommendation,
  BuildComplexity,
  ProductType,
  RecommendationStatus,
} from "@/types";
import {
  Lightbulb,
  Wrench,
  DollarSign,
  TrendingUp,
  Smartphone,
  Globe,
  Package,
  Boxes,
  Puzzle,
  Chrome,
  Eye,
  Save,
  X,
  Sparkles,
  Target,
  Clock,
  ArrowUpDown,
} from "lucide-react";

function getProductTypeIcon(type: ProductType | null) {
  switch (type) {
    case "saas":
      return <Globe className="h-4 w-4" />;
    case "tool":
      return <Wrench className="h-4 w-4" />;
    case "api":
      return <Package className="h-4 w-4" />;
    case "marketplace":
      return <Boxes className="h-4 w-4" />;
    case "mobile_app":
      return <Smartphone className="h-4 w-4" />;
    case "chrome_extension":
      return <Chrome className="h-4 w-4" />;
    default:
      return <Puzzle className="h-4 w-4" />;
  }
}

function getProductTypeBadge(type: ProductType | null) {
  const colors: Record<string, string> = {
    saas: "bg-blue-500/10 text-blue-600",
    tool: "bg-green-500/10 text-green-600",
    api: "bg-purple-500/10 text-purple-600",
    marketplace: "bg-orange-500/10 text-orange-600",
    mobile_app: "bg-pink-500/10 text-pink-600",
    chrome_extension: "bg-indigo-500/10 text-indigo-600",
  };

  const displayType = type || "unknown";
  const displayName = type?.replace(/_/g, " ") || "Unknown";

  return (
    <Badge className={`${colors[displayType] || "bg-gray-500/10 text-gray-600"} border-0 gap-1`}>
      {getProductTypeIcon(type)}
      {displayName}
    </Badge>
  );
}

function getComplexityBadge(complexity: BuildComplexity | null) {
  const colors: Record<string, string> = {
    weekend: "bg-green-500/10 text-green-600",
    month: "bg-yellow-500/10 text-yellow-600",
    quarter: "bg-red-500/10 text-red-600",
  };

  const icons: Record<string, JSX.Element> = {
    weekend: <Clock className="h-3 w-3" />,
    month: <Clock className="h-3 w-3" />,
    quarter: <Clock className="h-3 w-3" />,
  };

  if (!complexity) return null;

  return (
    <Badge className={`${colors[complexity]} border-0 gap-1`}>
      {icons[complexity]}
      {complexity}
    </Badge>
  );
}

function getStatusBadge(status: RecommendationStatus) {
  const colors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-600",
    saved: "bg-green-500/10 text-green-600",
    in_progress: "bg-yellow-500/10 text-yellow-600",
    completed: "bg-gray-500/10 text-gray-600",
    dismissed: "bg-red-500/10 text-red-600",
  };

  return (
    <Badge
      data-testid="status-badge"
      className={`${colors[status]} border-0 text-xs`}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

interface RecommendationCardProps {
  recommendation: BuildRecommendation;
  onStatusChange: (id: string, status: RecommendationStatus) => void;
  onViewDetails: (recommendation: BuildRecommendation) => void;
}

function RecommendationCard({
  recommendation,
  onStatusChange,
  onViewDetails,
}: RecommendationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: RecommendationStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange(recommendation.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card
      data-testid="recommendation-card"
      className="hover:shadow-md transition-shadow"
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getProductTypeBadge(recommendation.productType)}
              {getComplexityBadge(recommendation.buildComplexity)}
              {getStatusBadge(recommendation.status)}
            </div>
            <CardTitle
              data-testid="product-idea"
              className="text-xl font-semibold"
            >
              {recommendation.productIdea}
            </CardTitle>
            {recommendation.oneLiner && (
              <CardDescription
                data-testid="one-liner"
                className="text-base"
              >
                {recommendation.oneLiner}
              </CardDescription>
            )}
          </div>
          <div
            data-testid="confidence-score"
            className="flex flex-col items-center gap-1 bg-primary/10 rounded-lg px-3 py-2"
          >
            <Target className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold text-primary">
              {Math.round(recommendation.confidenceScore)}
            </span>
            <span className="text-xs text-muted-foreground">match</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Target Audience */}
        {recommendation.targetAudience && (
          <div className="flex items-start gap-2">
            <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {recommendation.targetAudience}
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {recommendation.buildComplexity && (
            <div
              data-testid="build-complexity"
              className="flex items-center gap-1"
            >
              <Wrench className="h-4 w-4" />
              <span className="capitalize">{recommendation.buildComplexity} Project</span>
            </div>
          )}
          {recommendation.estimatedCacRange && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{recommendation.estimatedCacRange} CAC</span>
            </div>
          )}
          {recommendation.supportingSignals > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{recommendation.supportingSignals} signals</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onViewDetails(recommendation)}
            disabled={isUpdating}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>

          {recommendation.status === "new" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("saved")}
                disabled={isUpdating}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("dismissed")}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-1" />
                Dismiss
              </Button>
            </>
          )}

          {recommendation.status === "saved" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("in_progress")}
              disabled={isUpdating}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Start Building
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BuildQueuePage() {
  const [recommendations, setRecommendations] = useState<BuildRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"confidence" | "created">("confidence");
  const [filterStatus, setFilterStatus] = useState<RecommendationStatus | "all">("new");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [filterStatus]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      params.append("limit", "20");

      const response = await fetch(`/api/recommendations?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setError("Failed to load recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: RecommendationStatus) => {
    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update recommendation");
      }

      // Update local state
      if (newStatus === "dismissed" || (filterStatus !== "all" && newStatus !== filterStatus)) {
        // Remove from current view
        setRecommendations((prev) => prev.filter((r) => r.id !== id));
      } else {
        // Update in place
        setRecommendations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }

      setError(null);
    } catch (error) {
      console.error("Error updating recommendation:", error);
      setError("Failed to update recommendation. Please try again.");
    }
  };

  const handleViewDetails = (recommendation: BuildRecommendation) => {
    // TODO: Open detail modal
    console.log("View details:", recommendation);
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    if (sortBy === "confidence") {
      return b.confidenceScore - a.confidenceScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="h-7 w-7" />
            Build Queue
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            AI-powered product recommendations backed by market demand
          </p>
        </div>
        <Button variant="default">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate
        </Button>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filterStatus}
          onValueChange={(value) => setFilterStatus(value as RecommendationStatus | "all")}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="saved">Saved</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as "confidence" | "created")}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confidence">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Confidence
              </div>
            </SelectItem>
            <SelectItem value="created">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-700">
              <X className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading recommendations...</p>
        </div>
      ) : sortedRecommendations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first set of product recommendations to get started
            </p>
            <Button variant="default">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Recommendations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onStatusChange={handleStatusChange}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}

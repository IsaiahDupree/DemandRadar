"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MessageSquare, TrendingUp, DollarSign, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface PainMapProps {
  painMap: {
    topObjections: { label: string; frequency: number; intensity: number }[];
    topFeatures: { label: string; frequency: number }[];
    pricingFriction: string[];
    trustIssues: string[];
  };
  summary: {
    totalMentions: number;
    topObjections: number;
  };
}

function IntensityHeatmap({
  objections,
}: {
  objections: { label: string; frequency: number; intensity: number }[];
}) {
  const maxFrequency = Math.max(...objections.map(o => o.frequency), 1);

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return "bg-red-500 text-white";
    if (intensity >= 60) return "bg-orange-500 text-white";
    if (intensity >= 40) return "bg-yellow-500 text-gray-900";
    return "bg-blue-500 text-white";
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 80) return "Critical";
    if (intensity >= 60) return "High";
    if (intensity >= 40) return "Medium";
    return "Low";
  };

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {objections.map((objection, index) => {
        const size = Math.max(120, (objection.frequency / maxFrequency) * 200);
        return (
          <div
            key={index}
            className={cn(
              "p-4 rounded-lg transition-all hover:scale-105 cursor-pointer",
              getIntensityColor(objection.intensity)
            )}
            style={{
              minHeight: `${size}px`,
            }}
          >
            <div className="flex flex-col h-full justify-between">
              <div>
                <Badge variant="outline" className="mb-2 bg-white/20">
                  {getIntensityLabel(objection.intensity)}
                </Badge>
                <h4 className="font-semibold text-sm mb-2">{objection.label}</h4>
              </div>
              <div className="flex items-center gap-4 text-xs opacity-90">
                <div>
                  <span className="opacity-75">Mentions:</span>{" "}
                  <span className="font-bold">{objection.frequency}</span>
                </div>
                <div>
                  <span className="opacity-75">Intensity:</span>{" "}
                  <span className="font-bold">{objection.intensity}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeatureRequestList({
  features,
}: {
  features: { label: string; frequency: number }[];
}) {
  const maxFrequency = Math.max(...features.map(f => f.frequency), 1);

  return (
    <div className="space-y-3">
      {features.map((feature, index) => {
        const percentage = (feature.frequency / maxFrequency) * 100;
        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                  {index + 1}
                </div>
                <span className="font-medium text-sm">{feature.label}</span>
              </div>
              <Badge variant="secondary">{feature.frequency} requests</Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-2 ml-9">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PainMap({ painMap, summary }: PainMapProps) {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reddit Mentions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalMentions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Posts and comments analyzed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Objection Clusters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{painMap.topObjections.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Common pain points identified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Feature Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{painMap.topFeatures.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unmet needs discovered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Objection Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle>User Objection Heatmap</CardTitle>
          </div>
          <CardDescription>
            Common complaints and pain points mentioned by users, sized by frequency and colored by intensity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {painMap.topObjections.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No objection data available
            </p>
          ) : (
            <>
              <IntensityHeatmap objections={painMap.topObjections} />
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Intensity Scale:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded" />
                  <span>High</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span>Critical</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Feature Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Top Feature Requests</CardTitle>
          </div>
          <CardDescription>
            Most frequently mentioned unmet needs and desired features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {painMap.topFeatures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No feature request data available
            </p>
          ) : (
            <FeatureRequestList features={painMap.topFeatures} />
          )}
        </CardContent>
      </Card>

      {/* Specific Pain Categories */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pricing Friction */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <CardTitle>Pricing Friction</CardTitle>
            </div>
            <CardDescription>
              Cost-related objections and concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {painMap.pricingFriction.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pricing friction detected
              </p>
            ) : (
              <ul className="space-y-2">
                {painMap.pricingFriction.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Trust Issues */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <CardTitle>Trust Issues</CardTitle>
            </div>
            <CardDescription>
              Credibility and reliability concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {painMap.trustIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No trust issues detected
              </p>
            ) : (
              <ul className="space-y-2">
                {painMap.trustIssues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Pain Point Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {painMap.topObjections.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  The most critical pain point is &quot;{painMap.topObjections[0].label}&quot; with {painMap.topObjections[0].frequency} mentions and intensity of {painMap.topObjections[0].intensity}.
                </span>
              </li>
            )}
            {painMap.topFeatures.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Users are most requesting &quot;{painMap.topFeatures[0].label}&quot; ({painMap.topFeatures[0].frequency} requests), indicating a clear unmet need.
                </span>
              </li>
            )}
            {painMap.pricingFriction.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  {painMap.pricingFriction.length} pricing-related objections detected, suggesting price sensitivity or value perception issues.
                </span>
              </li>
            )}
            {painMap.trustIssues.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  {painMap.trustIssues.length} trust-related concerns identified, indicating credibility could be a differentiator.
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

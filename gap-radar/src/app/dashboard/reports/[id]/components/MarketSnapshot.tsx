"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, TrendingUp, Clock } from "lucide-react";

interface MarketSnapshotProps {
  marketSnapshot: {
    topAdvertisers: { name: string; adCount: number }[];
    topAngles: { label: string; frequency: number }[];
    longestRunningAds: { advertiser: string; headline: string; daysRunning: number }[];
  };
  summary: {
    totalAds: number;
    uniqueAdvertisers: number;
  };
}

function AngleBar({ label, frequency, maxFrequency }: { label: string; frequency: number; maxFrequency: number }) {
  const percentage = (frequency / maxFrequency) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{frequency} ads</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function MarketSnapshot({ marketSnapshot, summary }: MarketSnapshotProps) {
  const maxAngleFrequency = Math.max(...marketSnapshot.topAngles.map(a => a.frequency), 1);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Ads Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAds}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active and archived creatives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Advertisers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.uniqueAdvertisers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Companies running ads
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Market Density</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.uniqueAdvertisers > 0
                ? (summary.totalAds / summary.uniqueAdvertisers).toFixed(1)
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ads per advertiser
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Advertisers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Top Advertisers</CardTitle>
          </div>
          <CardDescription>
            Companies with the most active ad creatives in this market
          </CardDescription>
        </CardHeader>
        <CardContent>
          {marketSnapshot.topAdvertisers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No advertiser data available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Advertiser Name</TableHead>
                  <TableHead className="text-right">Ad Count</TableHead>
                  <TableHead className="text-right">Market Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketSnapshot.topAdvertisers.map((advertiser, index) => {
                  const marketShare = ((advertiser.adCount / summary.totalAds) * 100).toFixed(1);
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{advertiser.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{advertiser.adCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {marketShare}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Common Angles */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            <CardTitle>Common Marketing Angles</CardTitle>
          </div>
          <CardDescription>
            Most frequently used messaging themes and value propositions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {marketSnapshot.topAngles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No angle data available
            </p>
          ) : (
            <div className="space-y-4">
              {marketSnapshot.topAngles.map((angle, index) => (
                <AngleBar
                  key={index}
                  label={angle.label}
                  frequency={angle.frequency}
                  maxFrequency={maxAngleFrequency}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Longest Running Ads */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Longest Running Ads</CardTitle>
          </div>
          <CardDescription>
            Ads with the longest active duration indicate proven creative concepts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {marketSnapshot.longestRunningAds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No longevity data available
            </p>
          ) : (
            <div className="space-y-3">
              {marketSnapshot.longestRunningAds.map((ad, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-1">{ad.advertiser}</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {ad.headline || "No headline available"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {ad.daysRunning} days
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {ad.daysRunning >= 90 ? "Proven" : ad.daysRunning >= 30 ? "Tested" : "New"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                {summary.uniqueAdvertisers >= 10
                  ? `High competition with ${summary.uniqueAdvertisers} active advertisers suggests a validated market.`
                  : summary.uniqueAdvertisers >= 5
                  ? `Moderate competition with ${summary.uniqueAdvertisers} advertisers indicates growing market interest.`
                  : `Low competition with ${summary.uniqueAdvertisers} advertisers may indicate either early opportunity or limited market viability.`}
              </span>
            </li>
            {marketSnapshot.longestRunningAds.length > 0 && marketSnapshot.longestRunningAds[0].daysRunning >= 90 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Ads running for {marketSnapshot.longestRunningAds[0].daysRunning}+ days indicate profitable campaigns and validated messaging.
                </span>
              </li>
            )}
            {marketSnapshot.topAngles.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  The most common angle &quot;{marketSnapshot.topAngles[0].label}&quot; appears in {marketSnapshot.topAngles[0].frequency} ads, suggesting a proven messaging strategy.
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Paid Market Snapshot Report Section
 *
 * Report Page 2: Displays top advertisers, repeated angles, longest-running ads,
 * and offer patterns from Meta and Google Ads data.
 *
 * @see PRD §8 - Report Structure (Paid Market Snapshot)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Target, DollarSign, Megaphone } from 'lucide-react';

export interface TopAdvertiser {
  advertiserName: string;
  creativeCount: number;
  averageDaysRunning: number;
  longestRunningDays: number;
}

export interface RepeatedAngle {
  angle: string;
  frequency: number;
  examples: {
    advertiser: string;
    snippet: string;
  }[];
}

export interface LongestRunningCreative {
  id: string;
  advertiserName: string;
  headline: string;
  daysRunning: number;
  isActive: boolean;
  snippet: string;
}

export interface OfferPattern {
  pattern: string;
  frequency: number;
  details: string;
}

export interface PaidMarketSnapshotProps {
  topAdvertisers: TopAdvertiser[];
  repeatedAngles: RepeatedAngle[];
  longestRunningCreatives: LongestRunningCreative[];
  offerPatterns: OfferPattern[];
}

/**
 * Get badge variant for active/inactive status
 */
function getStatusBadge(isActive: boolean) {
  return isActive ? (
    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
      Active
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
      Inactive
    </Badge>
  );
}

export function PaidMarketSnapshot({
  topAdvertisers,
  repeatedAngles,
  longestRunningCreatives,
  offerPatterns,
}: PaidMarketSnapshotProps) {
  // Limit display counts
  const displayAdvertisers = topAdvertisers.slice(0, 10);
  const displayAngles = repeatedAngles.slice(0, 5);
  const displayCreatives = longestRunningCreatives.slice(0, 5);
  const displayOffers = offerPatterns.slice(0, 10);

  return (
    <div className="space-y-6" data-testid="paid-market-snapshot">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          Paid Market Snapshot
        </h2>
        <p className="text-muted-foreground">
          What's working in paid advertising - top advertisers, repeated angles, and proven offers
        </p>
      </div>

      {/* Top Advertisers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Advertisers
          </CardTitle>
          <CardDescription>
            The most active advertisers in this niche
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayAdvertisers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No advertisers found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="advertisers-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Advertiser</TableHead>
                    <TableHead className="text-right">Creatives</TableHead>
                    <TableHead className="text-right">Avg Days Running</TableHead>
                    <TableHead className="text-right">Longest Running</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAdvertisers.map((advertiser, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {advertiser.advertiserName}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`advertiser-${index}-count`}>
                        {advertiser.creativeCount}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`advertiser-${index}-avg-days`}>
                        {advertiser.averageDaysRunning} days
                      </TableCell>
                      <TableCell className="text-right">
                        {advertiser.longestRunningDays} days
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Repeated Angles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Top Repeated Angles
          </CardTitle>
          <CardDescription>
            The most common messaging themes across creatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayAngles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No repeated angles found
            </p>
          ) : (
            <div className="space-y-4" data-testid="angles-list">
              {displayAngles.map((angle, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border"
                  data-testid={`angle-${index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{angle.angle}</h4>
                    <Badge variant="outline" data-testid={`angle-${index}-frequency`}>
                      {angle.frequency} mentions
                    </Badge>
                  </div>
                  <div className="space-y-2 mt-3">
                    {angle.examples.slice(0, 2).map((example, exampleIndex) => (
                      <div
                        key={exampleIndex}
                        className="text-sm bg-muted/50 p-3 rounded"
                      >
                        <p className="font-medium text-xs text-muted-foreground mb-1">
                          {example.advertiser}
                        </p>
                        <p className="text-foreground">{example.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Longest-Running Creatives */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Longest-Running Creatives
          </CardTitle>
          <CardDescription>
            Ads that have been running the longest (signal of performance)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayCreatives.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No long-running creatives found
            </p>
          ) : (
            <div className="space-y-4" data-testid="creatives-list">
              {displayCreatives.map((creative, index) => (
                <div
                  key={creative.id}
                  className="p-4 rounded-lg border"
                  data-testid={`creative-${index}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
                          data-testid={`creative-${index}-days`}
                        >
                          {creative.daysRunning} days
                        </Badge>
                        {getStatusBadge(creative.isActive)}
                      </div>
                      <h4 className="font-semibold mb-1">{creative.headline}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {creative.advertiserName}
                      </p>
                      <p className="text-sm">{creative.snippet}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offer Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Offer Patterns
          </CardTitle>
          <CardDescription>
            Common pricing, trials, and guarantees across advertisers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayOffers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No offer patterns found
            </p>
          ) : (
            <div className="space-y-3">
              {displayOffers.map((offer, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{offer.pattern}</h4>
                      <Badge variant="outline" data-testid={`offer-${index}-frequency`}>
                        {offer.frequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {offer.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

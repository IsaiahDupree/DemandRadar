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
import { DollarSign, TrendingUp, Users, BarChart3 } from "lucide-react";

interface EconomicsProps {
  economics: {
    conceptId: string;
    name: string;
    cpc: { low: number; expected: number; high: number };
    cac: { low: number; expected: number; high: number };
    tam: { low: number; expected: number; high: number };
  }[];
}

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function RangeDisplay({ low, expected, high, prefix = "$" }: { low: number; expected: number; high: number; prefix?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{prefix}{expected.toFixed(2)}</span>
        <Badge variant="outline" className="text-xs">Expected</Badge>
      </div>
      <div className="text-xs text-muted-foreground">
        Range: {prefix}{low.toFixed(2)} - {prefix}{high.toFixed(2)}
      </div>
    </div>
  );
}

export function Economics({ economics }: EconomicsProps) {
  if (economics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Modeled Economics</CardTitle>
          <CardDescription>
            No concept economics data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Generate concepts first to see economic projections
          </p>
        </CardContent>
      </Card>
    );
  }

  const avgCPC = economics.reduce((sum, c) => sum + c.cpc.expected, 0) / economics.length;
  const avgCAC = economics.reduce((sum, c) => sum + c.cac.expected, 0) / economics.length;
  const avgTAM = economics.reduce((sum, c) => sum + c.tam.expected, 0) / economics.length;
  const totalTAM = economics.reduce((sum, c) => sum + c.tam.expected, 0);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Avg CPC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${avgCPC.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expected cost per click
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Avg CAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${avgCAC.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expected customer acquisition cost
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Avg TAM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(avgTAM)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Expected total addressable market
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              Total TAM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalTAM)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Combined market opportunity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Economics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Concept Economics Breakdown</CardTitle>
          <CardDescription>
            Detailed cost and market size projections for each concept idea
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concept Name</TableHead>
                <TableHead>CPC</TableHead>
                <TableHead>CAC</TableHead>
                <TableHead>TAM</TableHead>
                <TableHead className="text-right">ROI Potential</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {economics.map((concept) => {
                // Simple ROI indicator based on TAM/CAC ratio
                const roiRatio = concept.tam.expected / concept.cac.expected;
                let roiLabel = "Low";
                let roiColor = "text-red-600";
                if (roiRatio > 5000) {
                  roiLabel = "Very High";
                  roiColor = "text-green-600";
                } else if (roiRatio > 2000) {
                  roiLabel = "High";
                  roiColor = "text-green-600";
                } else if (roiRatio > 500) {
                  roiLabel = "Medium";
                  roiColor = "text-orange-600";
                }

                return (
                  <TableRow key={concept.conceptId}>
                    <TableCell className="font-medium">{concept.name}</TableCell>
                    <TableCell>
                      <RangeDisplay
                        low={concept.cpc.low}
                        expected={concept.cpc.expected}
                        high={concept.cpc.high}
                      />
                    </TableCell>
                    <TableCell>
                      <RangeDisplay
                        low={concept.cac.low}
                        expected={concept.cac.expected}
                        high={concept.cac.high}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatCurrency(concept.tam.expected)}
                          </span>
                          <Badge variant="outline" className="text-xs">Expected</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Range: {formatCurrency(concept.tam.low)} - {formatCurrency(concept.tam.high)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={roiColor}>
                        {roiLabel}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Economics Insights */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Economic Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Average CPC of ${avgCPC.toFixed(2)} indicates {avgCPC < 1 ? "low-cost" : avgCPC < 3 ? "moderate-cost" : "high-cost"} customer acquisition via paid advertising.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Average CAC of ${avgCAC.toFixed(2)} suggests {avgCAC < 50 ? "highly efficient" : avgCAC < 150 ? "reasonable" : "expensive"} customer acquisition costs.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Total addressable market of {formatCurrency(totalTAM)} across all concepts represents significant revenue potential.
              </span>
            </li>
            {economics.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  Best economic opportunity: <strong>{economics.reduce((best, c) =>
                    (c.tam.expected / c.cac.expected) > (best.tam.expected / best.cac.expected) ? c : best
                  ).name}</strong> with strongest TAM/CAC ratio.
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Methodology Note */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-2 text-blue-900">About These Estimates</h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Economic projections are modeled estimates based on market analysis, competitive data, and industry benchmarks.
                Ranges represent low, expected, and high scenarios. Actual results will vary based on execution, market conditions,
                and competitive dynamics. Use these as directional guidance rather than precise predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

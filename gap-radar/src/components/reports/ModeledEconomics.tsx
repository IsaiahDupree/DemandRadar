/**
 * Modeled Economics Report Section
 *
 * Report Page 6: Displays CPC/CAC/TAM ranges with budget scenarios and
 * interactive sensitivity controls.
 *
 * @see PRD §8 - Report Structure (Modeled Economics)
 * @see Feature RG-010
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

export interface EconomicsData {
  cpc: { low: number; expected: number; high: number };
  cac: { low: number; expected: number; high: number };
  tam: { low: number; expected: number; high: number };
}

export interface ModeledEconomicsProps {
  economics: EconomicsData;
}

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format number with abbreviations
 */
function formatNumber(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Calculate progress percentage for range
 */
function calculateProgress(low: number, expected: number, high: number): number {
  if (high === low) return 50;
  return ((expected - low) / (high - low)) * 100;
}

/**
 * Modeled Economics Component
 */
export function ModeledEconomics({ economics }: ModeledEconomicsProps) {
  // Sensitivity controls
  const [cacMultiplier, setCacMultiplier] = useState(100); // 100 = 1.0x
  const [conversionRate, setConversionRate] = useState(2.5); // 2.5%

  // Calculate adjusted CAC based on sensitivity
  const adjustedCAC = {
    low: economics.cac.low * (cacMultiplier / 100),
    expected: economics.cac.expected * (cacMultiplier / 100),
    high: economics.cac.high * (cacMultiplier / 100),
  };

  // Budget scenarios
  const budgetScenarios = [
    {
      name: 'Low',
      budget: 5000,
      customers: Math.floor(5000 / adjustedCAC.expected),
    },
    {
      name: 'Medium',
      budget: 25000,
      customers: Math.floor(25000 / adjustedCAC.expected),
    },
    {
      name: 'High',
      budget: 100000,
      customers: Math.floor(100000 / adjustedCAC.expected),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Modeled Economics
        </CardTitle>
        <CardDescription>
          Economic metrics with budget scenarios and sensitivity analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Metric Ranges */}
        <div className="space-y-6">
          {/* CPC Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Cost Per Click (CPC)</h4>
              <span className="text-sm font-medium text-muted-foreground">
                Expected: {formatCurrency(economics.cpc.expected)}
              </span>
            </div>
            <Progress
              value={calculateProgress(economics.cpc.low, economics.cpc.expected, economics.cpc.high)}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(economics.cpc.low)}</span>
              <span>{formatCurrency(economics.cpc.high)}</span>
            </div>
          </div>

          {/* CAC Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Customer Acquisition Cost (CAC)</h4>
              <span className="text-sm font-medium text-muted-foreground">
                Expected: {formatCurrency(adjustedCAC.expected)}
              </span>
            </div>
            <Progress
              value={calculateProgress(adjustedCAC.low, adjustedCAC.expected, adjustedCAC.high)}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(adjustedCAC.low)}</span>
              <span>{formatCurrency(adjustedCAC.high)}</span>
            </div>
          </div>

          {/* TAM Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Total Addressable Market (TAM)</h4>
              <span className="text-sm font-medium text-muted-foreground">
                Expected: {formatNumber(economics.tam.expected)}
              </span>
            </div>
            <Progress
              value={calculateProgress(economics.tam.low, economics.tam.expected, economics.tam.high)}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatNumber(economics.tam.low)}</span>
              <span>{formatNumber(economics.tam.high)}</span>
            </div>
          </div>
        </div>

        {/* Budget Scenarios */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Budget Scenarios
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {budgetScenarios.map((scenario) => (
              <Card key={scenario.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{scenario.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {formatCurrency(scenario.budget)} budget
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{scenario.customers}</div>
                    <div className="text-xs text-muted-foreground">Potential Customers</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sensitivity Controls */}
        <div className="space-y-6">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sensitivity Analysis
          </h4>

          {/* CAC Multiplier Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="cac-slider" className="text-sm font-medium">
                CAC Adjustment
              </label>
              <span className="text-sm text-muted-foreground">
                {cacMultiplier}% ({(cacMultiplier / 100).toFixed(2)}x)
              </span>
            </div>
            <input
              type="range"
              id="cac-slider"
              aria-label="CAC"
              role="slider"
              value={cacMultiplier}
              onChange={(e) => setCacMultiplier(Number(e.target.value))}
              min={50}
              max={200}
              step={5}
              className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50% (0.5x)</span>
              <span>200% (2.0x)</span>
            </div>
          </div>

          {/* Conversion Rate Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="conversion-slider" className="text-sm font-medium">
                Conversion Rate
              </label>
              <span className="text-sm text-muted-foreground">{conversionRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              id="conversion-slider"
              aria-label="Conversion"
              role="slider"
              value={conversionRate}
              onChange={(e) => setConversionRate(Number(e.target.value))}
              min={0.5}
              max={10}
              step={0.5}
              className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.5%</span>
              <span>10%</span>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h5 className="text-sm font-semibold">Impact Summary</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Adjusted CAC</div>
              <div className="font-semibold">{formatCurrency(adjustedCAC.expected)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Efficiency Rate</div>
              <div className="font-semibold">{Math.floor(50000 / adjustedCAC.expected)} per $50k spend</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

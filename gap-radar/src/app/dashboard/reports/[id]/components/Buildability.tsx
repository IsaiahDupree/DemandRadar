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
import { Progress } from "@/components/ui/progress";
import { Hammer, Code, Rocket, Users, Bot, AlertCircle } from "lucide-react";

interface BuildabilityProps {
  buildability: {
    conceptId: string;
    name: string;
    implementationDifficulty: number;
    buildDifficulty: number;
    distributionDifficulty: number;
    humanTouchLevel: string;
    autonomousSuitability: string;
  }[];
}

function DifficultyBar({ value, label }: { value: number; label: string }) {
  const getColor = (val: number) => {
    if (val <= 3) return "bg-green-500";
    if (val <= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getTextColor = (val: number) => {
    if (val <= 3) return "text-green-600";
    if (val <= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${getTextColor(value)}`}>{value}/10</span>
      </div>
      <Progress value={value * 10} className={`h-2 ${getColor(value)}`} />
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  const colors = {
    high: "bg-red-500/10 text-red-600 border-red-200",
    medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    low: "bg-green-500/10 text-green-600 border-green-200",
  };

  return (
    <Badge variant="outline" className={colors[level as keyof typeof colors] || colors.medium}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
}

export function Buildability({ buildability }: BuildabilityProps) {
  if (buildability.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Buildability Assessment</CardTitle>
          <CardDescription>
            No buildability data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Generate concepts first to see buildability assessments
          </p>
        </CardContent>
      </Card>
    );
  }

  const avgImplementation = buildability.reduce((sum, c) => sum + c.implementationDifficulty, 0) / buildability.length;
  const avgBuild = buildability.reduce((sum, c) => sum + c.buildDifficulty, 0) / buildability.length;
  const avgDistribution = buildability.reduce((sum, c) => sum + c.distributionDifficulty, 0) / buildability.length;

  const easiestToImplement = [...buildability].sort((a, b) => a.implementationDifficulty - b.implementationDifficulty)[0];
  const easiestToBuild = [...buildability].sort((a, b) => a.buildDifficulty - b.buildDifficulty)[0];

  const highAutonomousSuitability = buildability.filter(c => c.autonomousSuitability === 'high').length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Hammer className="h-4 w-4 text-blue-600" />
              Avg Implementation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgImplementation.toFixed(1)}/10
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgImplementation <= 3 ? "Easy" : avgImplementation <= 6 ? "Moderate" : "Difficult"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Code className="h-4 w-4 text-green-600" />
              Avg Build
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgBuild.toFixed(1)}/10
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgBuild <= 3 ? "Easy" : avgBuild <= 6 ? "Moderate" : "Difficult"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Rocket className="h-4 w-4 text-purple-600" />
              Avg Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgDistribution.toFixed(1)}/10
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {avgDistribution <= 3 ? "Easy" : avgDistribution <= 6 ? "Moderate" : "Difficult"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="h-4 w-4 text-orange-600" />
              High Automation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {highAutonomousSuitability}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Concepts suitable for automation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Buildability Table */}
      <Card>
        <CardHeader>
          <CardTitle>Concept Buildability Breakdown</CardTitle>
          <CardDescription>
            Detailed difficulty assessments for implementation, development, and distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concept Name</TableHead>
                <TableHead>Implementation</TableHead>
                <TableHead>Build</TableHead>
                <TableHead>Distribution</TableHead>
                <TableHead>Human Touch</TableHead>
                <TableHead>Automation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildability.map((concept) => (
                <TableRow key={concept.conceptId}>
                  <TableCell className="font-medium">{concept.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {concept.implementationDifficulty}/10
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          concept.implementationDifficulty <= 3
                            ? "text-green-600"
                            : concept.implementationDifficulty <= 6
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {concept.implementationDifficulty <= 3 ? "Easy" : concept.implementationDifficulty <= 6 ? "Medium" : "Hard"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {concept.buildDifficulty}/10
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          concept.buildDifficulty <= 3
                            ? "text-green-600"
                            : concept.buildDifficulty <= 6
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {concept.buildDifficulty <= 3 ? "Easy" : concept.buildDifficulty <= 6 ? "Medium" : "Hard"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {concept.distributionDifficulty}/10
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          concept.distributionDifficulty <= 3
                            ? "text-green-600"
                            : concept.distributionDifficulty <= 6
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {concept.distributionDifficulty <= 3 ? "Easy" : concept.distributionDifficulty <= 6 ? "Medium" : "Hard"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <LevelBadge level={concept.humanTouchLevel} />
                  </TableCell>
                  <TableCell>
                    <LevelBadge level={concept.autonomousSuitability} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Wins & Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Easiest to Launch</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold mb-2">{easiestToImplement.name}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Lowest overall implementation complexity
              </p>
              <div className="space-y-3">
                <DifficultyBar
                  value={easiestToImplement.implementationDifficulty}
                  label="Implementation"
                />
                <DifficultyBar
                  value={easiestToImplement.buildDifficulty}
                  label="Build"
                />
                <DifficultyBar
                  value={easiestToImplement.distributionDifficulty}
                  label="Distribution"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-900">Automation Candidates</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {buildability
                .filter(c => c.autonomousSuitability === 'high')
                .map((concept) => (
                  <li key={concept.conceptId} className="flex items-start gap-2">
                    <div className="p-1 rounded bg-blue-100 mt-0.5">
                      <Bot className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{concept.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {concept.humanTouchLevel === 'low' ? "Minimal manual intervention required" : "Some human oversight needed"}
                      </p>
                    </div>
                  </li>
                ))}
              {buildability.filter(c => c.autonomousSuitability === 'high').length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No concepts identified as highly suitable for automation
                </p>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Buildability Insights */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Buildability Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Average implementation difficulty of {avgImplementation.toFixed(1)}/10 suggests {avgImplementation <= 4 ? "accessible entry points" : avgImplementation <= 7 ? "moderate development effort" : "significant technical challenges"}.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                <strong>{easiestToBuild.name}</strong> offers the easiest build path with difficulty score of {easiestToBuild.buildDifficulty}/10.
              </span>
            </li>
            {highAutonomousSuitability > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  {highAutonomousSuitability} concept{highAutonomousSuitability > 1 ? "s" : ""} highly suitable for automation, reducing ongoing operational overhead.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Distribution difficulty averages {avgDistribution.toFixed(1)}/10, indicating {avgDistribution <= 4 ? "established channels available" : avgDistribution <= 7 ? "moderate GTM effort needed" : "significant market entry barriers"}.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Methodology Note */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-2 text-orange-900">About Difficulty Scores</h4>
              <p className="text-xs text-orange-800 leading-relaxed">
                Difficulty scores (1-10) are AI-generated estimates based on technical complexity, resource requirements, and market conditions.
                <strong className="block mt-1">1-3 = Easy</strong> (can be built by solo developer or small team),
                <strong className="block mt-1">4-7 = Moderate</strong> (requires dedicated team and moderate resources),
                <strong className="block mt-1">8-10 = Hard</strong> (requires significant team, time, and capital investment).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

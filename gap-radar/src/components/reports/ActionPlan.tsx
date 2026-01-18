/**
 * Action Plan Report Section
 *
 * Report Page 9: Displays 7-day quick wins, 30-day roadmap, ad test concepts,
 * landing page structure, and top keywords to target.
 *
 * @see PRD §8 - Report Structure (Action Plan)
 * @see Feature RG-013
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Zap,
  Calendar,
  Lightbulb,
  Layout,
  Search,
  CheckCircle2,
  TrendingUp,
  Users,
} from 'lucide-react';

export type Effort = 'low' | 'medium' | 'high';
export type Impact = 'low' | 'medium' | 'high';
export type Category = 'product' | 'offer' | 'positioning' | 'trust' | 'pricing';

export interface QuickWin {
  id: string;
  title: string;
  description: string;
  effort: Effort;
  impact: Impact;
  category: Category;
}

export interface RoadmapItem {
  id: string;
  week: number;
  title: string;
  tasks: string[];
}

export interface AdConcept {
  id: string;
  angle: string;
  headline: string;
  body: string;
  cta: string;
  targetAudience: string;
}

export interface LandingPageStructure {
  hero: string;
  sections: string[];
  recommendations: string[];
}

export interface Keyword {
  term: string;
  difficulty: number;
  volume: number;
}

export interface ActionPlanData {
  quickWins: QuickWin[];
  roadmap: RoadmapItem[];
  adConcepts: AdConcept[];
  landingPageStructure: LandingPageStructure;
  keywords: Keyword[];
}

export interface ActionPlanProps {
  actionPlan: ActionPlanData;
}

/**
 * Get badge variant for effort/impact
 */
function getEffortVariant(effort: Effort): 'default' | 'secondary' | 'destructive' {
  switch (effort) {
    case 'low':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'high':
      return 'destructive';
  }
}

function getImpactVariant(impact: Impact): 'default' | 'secondary' | 'destructive' {
  switch (impact) {
    case 'low':
      return 'secondary';
    case 'medium':
      return 'default';
    case 'high':
      return 'destructive';
  }
}

/**
 * Get difficulty color class
 */
function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 30) return 'text-green-600 dark:text-green-400';
  if (difficulty <= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Action Plan Component
 */
export function ActionPlan({ actionPlan }: ActionPlanProps) {
  return (
    <div data-testid="action-plan">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Action Plan
          </CardTitle>
          <CardDescription>
            Prioritized actions, ad concepts, and keyword opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Quick Wins (7-day) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h4 className="text-lg font-semibold">Quick Wins (7-day)</h4>
            </div>

            {actionPlan.quickWins.length === 0 ? (
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                No quick wins identified
              </div>
            ) : (
              <div className="space-y-3">
                {actionPlan.quickWins.map((win) => (
                  <Card key={win.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h5 className="font-semibold">{win.title}</h5>
                            <p className="text-sm text-muted-foreground mt-1">{win.description}</p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={getEffortVariant(win.effort)}>
                            Effort: {win.effort}
                          </Badge>
                          <Badge variant={getImpactVariant(win.impact)}>
                            Impact: {win.impact}
                          </Badge>
                          <Badge variant="outline">{win.category}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 30-day Roadmap */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-lg font-semibold">30-day Roadmap</h4>
            </div>

            <div className="space-y-4">
              {actionPlan.roadmap.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="default">Week {item.week}</Badge>
                        <h5 className="font-semibold">{item.title}</h5>
                      </div>
                      <ul className="space-y-1 ml-4">
                        {item.tasks.map((task, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Ad Test Concepts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h4 className="text-lg font-semibold">Ad Test Concepts</h4>
            </div>

            {actionPlan.adConcepts.length === 0 ? (
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                No ad concepts generated
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {actionPlan.adConcepts.map((concept) => (
                  <Card key={concept.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {concept.angle}
                          </Badge>
                          <h5 className="font-semibold text-lg">{concept.headline}</h5>
                        </div>
                        <p className="text-sm text-muted-foreground">{concept.body}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4" />
                            <span className="text-muted-foreground">{concept.targetAudience}</span>
                          </div>
                          <div className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
                            {concept.cta}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Landing Page Structure */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="text-lg font-semibold">Landing Page Structure</h4>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Hero */}
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Hero Section</h5>
                    <p className="text-sm text-muted-foreground">{actionPlan.landingPageStructure.hero}</p>
                  </div>

                  {/* Sections */}
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Page Sections</h5>
                    <ol className="space-y-2">
                      {actionPlan.landingPageStructure.sections.map((section, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary font-medium">{idx + 1}.</span>
                          <span className="text-muted-foreground">{section}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Recommendations</h5>
                    <ul className="space-y-2">
                      {actionPlan.landingPageStructure.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                          <span className="text-muted-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Keywords */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h4 className="text-lg font-semibold">Top Keywords to Target</h4>
            </div>

            {actionPlan.keywords.length === 0 ? (
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                No keywords identified
              </div>
            ) : (
              <div className="space-y-2">
                {actionPlan.keywords.map((keyword, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h5 className="font-semibold">{keyword.term}</h5>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Difficulty:</span>
                              <span className={`text-sm font-semibold ${getDifficultyColor(keyword.difficulty)}`}>
                                {keyword.difficulty}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {formatNumber(keyword.volume)} searches/mo
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant={keyword.difficulty <= 30 ? 'default' : keyword.difficulty <= 60 ? 'secondary' : 'destructive'}>
                            {keyword.difficulty <= 30 ? 'Easy' : keyword.difficulty <= 60 ? 'Medium' : 'Hard'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

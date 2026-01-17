"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Hammer,
  Megaphone,
  FileText,
  Target,
} from "lucide-react";

interface ActionPlanProps {
  actionPlan: {
    sevenDay: ActionItem[];
    thirtyDay: ActionItem[];
    quickWins: string[];
    keyRisks: string[];
    nextSteps: string;
  } | null;
}

interface ActionItem {
  day: number;
  task: string;
  category: 'research' | 'build' | 'marketing' | 'content' | 'validation';
  effort: 'low' | 'medium' | 'high';
  resources?: string[];
  deliverable?: string;
  priority: 'critical' | 'high' | 'medium';
}

const categoryIcons = {
  research: Lightbulb,
  build: Hammer,
  marketing: Megaphone,
  content: FileText,
  validation: Target,
};

const categoryColors = {
  research: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  build: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  marketing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  content: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  validation: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

const effortColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const priorityColors = {
  critical: "border-red-500 dark:border-red-600",
  high: "border-orange-500 dark:border-orange-600",
  medium: "border-blue-500 dark:border-blue-600",
};

function ActionItemCard({ item, showDay = true }: { item: ActionItem; showDay?: boolean }) {
  const CategoryIcon = categoryIcons[item.category];

  return (
    <Card className={`${priorityColors[item.priority]} border-l-4`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {showDay && (
                <Badge variant="outline" className="font-mono">
                  Day {item.day}
                </Badge>
              )}
              <Badge className={categoryColors[item.category]}>
                <CategoryIcon className="h-3 w-3 mr-1" />
                {item.category}
              </Badge>
              <Badge variant="secondary" className={effortColors[item.effort]}>
                {item.effort} effort
              </Badge>
            </div>
            <CardTitle className="text-base">{item.task}</CardTitle>
          </div>
        </div>
      </CardHeader>
      {(item.deliverable || item.resources) && (
        <CardContent className="space-y-2 pt-0">
          {item.deliverable && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Deliverable:</p>
              <p className="text-sm flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {item.deliverable}
              </p>
            </div>
          )}
          {item.resources && item.resources.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Resources:</p>
              <div className="flex flex-wrap gap-1">
                {item.resources.map((resource, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {resource}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function WeekSection({ title, items, weekNumber }: { title: string; items: ActionItem[]; weekNumber: number }) {
  const weekItems = items.filter(item => {
    const weekStart = (weekNumber - 1) * 7 + 1;
    const weekEnd = weekNumber * 7;
    return item.day >= weekStart && item.day <= weekEnd;
  });

  if (weekItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        {title}
      </h4>
      <div className="space-y-3">
        {weekItems.map((item, i) => (
          <ActionItemCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function ActionPlan({ actionPlan }: ActionPlanProps) {
  if (!actionPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Action Plan
          </CardTitle>
          <CardDescription>
            No action plan available for this report
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Wins Section */}
      {actionPlan.quickWins && actionPlan.quickWins.length > 0 && (
        <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Zap className="h-5 w-5" />
              Quick Wins
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              High-impact actions you can take immediately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {actionPlan.quickWins.map((win, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{win}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Risks Section */}
      {actionPlan.keyRisks && actionPlan.keyRisks.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5" />
              Key Risks to Watch
            </CardTitle>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Potential pitfalls to avoid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {actionPlan.keyRisks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{risk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Action Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Action Plans
          </CardTitle>
          <CardDescription>
            Step-by-step plans to launch your product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="7day" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="7day" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                7-Day Quick Start
              </TabsTrigger>
              <TabsTrigger value="30day" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                30-Day Comprehensive
              </TabsTrigger>
            </TabsList>

            {/* 7-Day Plan */}
            <TabsContent value="7day" className="space-y-4 mt-6">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Goal:</strong> Validate your idea and build initial traction in one week
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {actionPlan.sevenDay.map((item, i) => (
                  <ActionItemCard key={i} item={item} />
                ))}
              </div>
            </TabsContent>

            {/* 30-Day Plan */}
            <TabsContent value="30day" className="space-y-6 mt-6">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Goal:</strong> Build and launch your MVP with initial customers
                </AlertDescription>
              </Alert>

              <WeekSection title="Week 1: Validation" items={actionPlan.thirtyDay} weekNumber={1} />
              <WeekSection title="Week 2: MVP Planning" items={actionPlan.thirtyDay} weekNumber={2} />
              <WeekSection title="Week 3: Build & Test" items={actionPlan.thirtyDay} weekNumber={3} />
              <WeekSection title="Week 4: Launch Prep" items={actionPlan.thirtyDay} weekNumber={4} />

              {/* Overflow items (day 29-30) */}
              {actionPlan.thirtyDay.filter(item => item.day > 28).length > 0 && (
                <div className="space-y-3 mt-4">
                  <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Final Days
                  </h4>
                  <div className="space-y-3">
                    {actionPlan.thirtyDay
                      .filter(item => item.day > 28)
                      .map((item, i) => (
                        <ActionItemCard key={i} item={item} />
                      ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Next Steps */}
      {actionPlan.nextSteps && (
        <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <ArrowRight className="h-5 w-5" />
              What Comes Next?
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              After day 30
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{actionPlan.nextSteps}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

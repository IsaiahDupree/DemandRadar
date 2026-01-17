/**
 * Experiments Dashboard
 *
 * View experiment suggestions and track results
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Beaker,
  TrendingUp,
  Target,
  DollarSign,
  Zap,
  Users,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ExperimentSuggestion {
  id?: string;
  type: 'copy' | 'angle' | 'offer' | 'pricing' | 'feature' | 'targeting';
  title: string;
  hypothesis: string;
  setup: string;
  success_metrics: string[];
  estimated_effort: 'low' | 'medium' | 'high';
  priority: number;
  evidence: string;
  status?: 'suggested' | 'running' | 'completed';
  niche_name?: string;
}

const EXPERIMENT_ICONS = {
  copy: Tag,
  angle: TrendingUp,
  offer: DollarSign,
  pricing: DollarSign,
  feature: Zap,
  targeting: Users,
};

const EXPERIMENT_COLORS = {
  copy: 'text-purple-600',
  angle: 'text-blue-600',
  offer: 'text-green-600',
  pricing: 'text-orange-600',
  feature: 'text-yellow-600',
  targeting: 'text-pink-600',
};

const EFFORT_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<ExperimentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('suggested');

  useEffect(() => {
    fetchExperiments();
  }, []);

  async function fetchExperiments() {
    try {
      // Mock data for now - would fetch from API
      const mockExperiments: ExperimentSuggestion[] = [
        {
          id: '1',
          type: 'copy',
          title: 'Test pain-focused hook vs benefit hook',
          hypothesis:
            'If we test pain-point hooks, we believe CTR will increase by 15% because users are actively seeking solutions',
          setup:
            '1. Create 2 ad variants\n2. Split traffic 50/50\n3. Run for 7 days with $50/day\n4. Track CTR and CPC',
          success_metrics: ['CTR > 2%', 'CPC < $1.50', 'Engagement > 3%'],
          estimated_effort: 'low',
          priority: 9,
          evidence: 'Top complaint mentions "too expensive" - pain-focused messaging may resonate',
          status: 'suggested',
          niche_name: 'Productivity Apps',
        },
        {
          id: '2',
          type: 'angle',
          title: 'Test "time-saving" angle',
          hypothesis:
            'If we emphasize time-saving benefits, conversions will improve by 20% because this is an underserved angle',
          setup:
            '1. Create landing page variant\n2. Update ad copy\n3. A/B test for 1 week\n4. Measure conversion rate',
          success_metrics: ['Conversion rate > 5%', 'Time on page > 2 min'],
          estimated_effort: 'medium',
          priority: 8,
          evidence: 'Only 1 of top 5 competitors mentions time-saving',
          status: 'running',
          niche_name: 'Productivity Apps',
        },
        {
          id: '3',
          type: 'offer',
          title: 'Test free trial vs money-back guarantee',
          hypothesis:
            'If we offer 14-day free trial, signups will increase 30% due to lower perceived risk',
          setup:
            '1. Update pricing page\n2. Set up trial flow\n3. Track signup rate\n4. Run for 7 days',
          success_metrics: ['Signups > +25%', 'Trial→Paid > 40%'],
          estimated_effort: 'high',
          priority: 7,
          evidence: 'Top desire is "try before buying" - 40% of user requests',
          status: 'completed',
          niche_name: 'Productivity Apps',
        },
      ];

      setExperiments(mockExperiments);
    } catch (error) {
      console.error('Error fetching experiments:', error);
    } finally {
      setLoading(false);
    }
  }

  function updateExperimentStatus(id: string, status: string) {
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, status: status as any } : exp))
    );
  }

  const filteredExperiments = experiments.filter((exp) => {
    if (activeTab === 'all') return true;
    return exp.status === activeTab;
  });

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Experiments</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Beaker className="h-8 w-8" />
          Experiments
        </h1>
        <p className="text-muted-foreground">
          Weekly experiment suggestions and results tracking
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="suggested">
            Suggested ({experiments.filter((e) => e.status === 'suggested').length})
          </TabsTrigger>
          <TabsTrigger value="running">
            Running ({experiments.filter((e) => e.status === 'running').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({experiments.filter((e) => e.status === 'completed').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredExperiments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Beaker className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No experiments yet</h3>
            <p className="text-muted-foreground">
              Experiment suggestions will appear here based on your demand briefs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredExperiments.map((experiment) => {
            const Icon = EXPERIMENT_ICONS[experiment.type];
            const iconColor = EXPERIMENT_COLORS[experiment.type];
            const StatusIcon =
              experiment.status === 'completed'
                ? CheckCircle2
                : experiment.status === 'running'
                ? Clock
                : AlertCircle;

            return (
              <Card key={experiment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <Icon className={`h-6 w-6 mt-1 ${iconColor}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl">{experiment.title}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {experiment.type}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <span className="font-medium">{experiment.niche_name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Priority: {experiment.priority}/10
                          </span>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={EFFORT_COLORS[experiment.estimated_effort]}>
                        {experiment.estimated_effort} effort
                      </Badge>
                      <StatusIcon
                        className={`h-5 w-5 ${
                          experiment.status === 'completed'
                            ? 'text-green-600'
                            : experiment.status === 'running'
                            ? 'text-blue-600'
                            : 'text-orange-600'
                        }`}
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Hypothesis */}
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Hypothesis</h4>
                    <p className="text-sm text-muted-foreground italic">
                      {experiment.hypothesis}
                    </p>
                  </div>

                  {/* Evidence */}
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Evidence</h4>
                    <p className="text-sm text-muted-foreground">{experiment.evidence}</p>
                  </div>

                  {/* Setup */}
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Setup</h4>
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans bg-muted p-3 rounded">
                      {experiment.setup}
                    </pre>
                  </div>

                  {/* Success Metrics */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Success Metrics</h4>
                    <div className="flex flex-wrap gap-2">
                      {experiment.success_metrics.map((metric, idx) => (
                        <Badge key={idx} variant="secondary">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {experiment.status === 'suggested' && (
                      <>
                        <Button
                          onClick={() => updateExperimentStatus(experiment.id!, 'running')}
                        >
                          Start Experiment
                        </Button>
                        <Button variant="outline">Skip</Button>
                      </>
                    )}
                    {experiment.status === 'running' && (
                      <>
                        <Button
                          onClick={() => updateExperimentStatus(experiment.id!, 'completed')}
                        >
                          Mark Complete
                        </Button>
                        <Button variant="outline">View Results</Button>
                      </>
                    )}
                    {experiment.status === 'completed' && (
                      <Button variant="outline">View Results</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { 
  BarChart3, 
  Brain, 
  Target, 
  TrendingUp, 
  Lightbulb, 
  FileText,
  Zap,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'GPT-4 extracts offers, claims, and objections from thousands of ads and discussions.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Target,
    title: 'Gap Detection',
    description: 'Find mismatches between what ads promise and what customers actually complain about.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Trends',
    description: 'Live data from Reddit, Meta Ads, Google, and social platforms updated continuously.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: BarChart3,
    title: 'Opportunity Scoring',
    description: 'Proprietary scoring system ranks opportunities by longevity, dissatisfaction, and saturation.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Lightbulb,
    title: 'Product Ideas',
    description: 'Get "3% Better" recommendations with MVP specs, TAM estimates, and CAC projections.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: FileText,
    title: 'UGC Playbooks',
    description: 'AI-generated hooks, scripts, and shot lists based on top-performing content.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Zap,
    title: 'Instant Reports',
    description: 'Full market analysis in under 2 minutes. Export to PDF, CSV, or JSON.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Shield,
    title: 'Data You Can Trust',
    description: 'Confidence scores show data quality. Never act on unreliable insights.',
    color: 'from-teal-500 to-cyan-500',
  },
];

export function Features() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, i) => (
        <div
          key={feature.title}
          data-testid="feature-item"
          className={cn(
            "group relative bg-card border rounded-2xl p-6 hover:border-primary/50 transition-all",
            "hover:shadow-xl hover:-translate-y-1"
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
            "bg-gradient-to-br",
            feature.color
          )}>
            <feature.icon className="h-6 w-6 text-white" />
          </div>
          
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
            {feature.title}
          </h3>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}

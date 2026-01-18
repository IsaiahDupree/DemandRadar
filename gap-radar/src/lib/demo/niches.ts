/**
 * Demo niches with pre-generated data for onboarding
 * These are instant-view examples that don't require authentication
 */

export interface DemoNiche {
  id: string;
  name: string;
  category: string;
  description: string;
  opportunityScore: number;
  confidence: number;
  preview: {
    topGaps: {
      title: string;
      type: 'product' | 'offer' | 'positioning' | 'trust' | 'pricing';
      score: number;
    }[];
    marketSnapshot: {
      totalAds: number;
      uniqueAdvertisers: number;
      totalMentions: number;
    };
    topInsights: string[];
    platformRecommendation: 'web' | 'mobile' | 'hybrid';
  };
}

export const DEMO_NICHES: DemoNiche[] = [
  {
    id: 'demo-ai-writing-tools',
    name: 'AI Writing Tools for Content Creators',
    category: 'AI & Productivity',
    description: 'Tools that help content creators write faster and better using AI',
    opportunityScore: 82,
    confidence: 0.88,
    preview: {
      topGaps: [
        {
          title: 'Lack of brand voice consistency',
          type: 'product',
          score: 87,
        },
        {
          title: 'Generic output that needs heavy editing',
          type: 'product',
          score: 84,
        },
        {
          title: 'No content calendar integration',
          type: 'product',
          score: 79,
        },
      ],
      marketSnapshot: {
        totalAds: 147,
        uniqueAdvertisers: 23,
        totalMentions: 892,
      },
      topInsights: [
        'Users want AI that learns their unique voice and style',
        'Biggest complaint: output feels robotic and requires heavy editing',
        'High demand for integration with existing content workflows',
        'Pricing friction: many tools charge per word vs per project',
      ],
      platformRecommendation: 'web',
    },
  },
  {
    id: 'demo-fitness-tracking',
    name: 'Fitness Tracking for Busy Professionals',
    category: 'Health & Fitness',
    description: 'Simple fitness tracking for people who don\'t have time for complex apps',
    opportunityScore: 76,
    confidence: 0.85,
    preview: {
      topGaps: [
        {
          title: 'Too many features cause overwhelm',
          type: 'product',
          score: 91,
        },
        {
          title: 'Unrealistic workout plans',
          type: 'positioning',
          score: 85,
        },
        {
          title: 'No integration with work calendar',
          type: 'product',
          score: 78,
        },
      ],
      marketSnapshot: {
        totalAds: 203,
        uniqueAdvertisers: 34,
        totalMentions: 1247,
      },
      topInsights: [
        'Users complain existing apps are too complex with too many features',
        'Want realistic plans for 20-30 min workouts, not 90 min sessions',
        'Need to sync with work calendar to find realistic workout times',
        'Frustration with subscription fatigue - prefer one-time purchase',
      ],
      platformRecommendation: 'mobile',
    },
  },
  {
    id: 'demo-freelance-invoicing',
    name: 'Freelance Invoicing & Payment Tracking',
    category: 'Business & Finance',
    description: 'Simple invoicing for solo freelancers without accounting complexity',
    opportunityScore: 88,
    confidence: 0.91,
    preview: {
      topGaps: [
        {
          title: 'Complicated accounting features not needed by solopreneurs',
          type: 'product',
          score: 93,
        },
        {
          title: 'High monthly fees for basic invoicing',
          type: 'pricing',
          score: 89,
        },
        {
          title: 'No automated payment reminders that feel personal',
          type: 'product',
          score: 82,
        },
      ],
      marketSnapshot: {
        totalAds: 178,
        uniqueAdvertisers: 29,
        totalMentions: 1056,
      },
      topInsights: [
        'Solo freelancers don\'t need full accounting - just invoicing + payment tracking',
        'Major pricing friction: users don\'t want $30/mo for 5 invoices',
        'Want payment reminders that are automated but don\'t sound robotic',
        'High demand for beautiful, customizable invoice templates',
      ],
      platformRecommendation: 'web',
    },
  },
];

/**
 * Get all demo niches
 */
export function getDemoNiches(): DemoNiche[] {
  return DEMO_NICHES;
}

/**
 * Get a single demo niche by ID
 */
export function getDemoNiche(id: string): DemoNiche | undefined {
  return DEMO_NICHES.find((niche) => niche.id === id);
}

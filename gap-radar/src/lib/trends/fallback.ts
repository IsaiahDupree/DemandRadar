export interface TrendingTopic {
  id: string;
  topic: string;
  category: string;
  volume: number;
  growth: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sources: string[];
  relatedTerms: string[];
  opportunityScore: number;
}

export const FALLBACK_TRENDS: TrendingTopic[] = [
  {
    id: 'trend-1',
    topic: 'AI Writing Assistants for Small Teams',
    category: 'AI & Automation',
    volume: 12500,
    growth: 45,
    sentiment: 'positive',
    sources: ['Reddit', 'ProductHunt'],
    relatedTerms: ['GPT', 'content creation', 'copywriting'],
    opportunityScore: 85,
  },
  {
    id: 'trend-2',
    topic: 'Notion Alternatives with Better Pricing',
    category: 'Productivity',
    volume: 8200,
    growth: 32,
    sentiment: 'neutral',
    sources: ['Reddit', 'Twitter'],
    relatedTerms: ['project management', 'workspace', 'notes'],
    opportunityScore: 78,
  },
  {
    id: 'trend-3',
    topic: 'No-Code Form Builders for Startups',
    category: 'Development',
    volume: 6800,
    growth: 28,
    sentiment: 'positive',
    sources: ['Reddit', 'Indie Hackers'],
    relatedTerms: ['forms', 'surveys', 'typeform alternative'],
    opportunityScore: 72,
  },
  {
    id: 'trend-4',
    topic: 'Social Media Scheduling with AI Captions',
    category: 'Marketing',
    volume: 15000,
    growth: 52,
    sentiment: 'positive',
    sources: ['Reddit', 'ProductHunt'],
    relatedTerms: ['scheduling', 'automation', 'social media'],
    opportunityScore: 88,
  },
  {
    id: 'trend-5',
    topic: 'Invoice Software for Freelancers',
    category: 'Finance',
    volume: 9500,
    growth: 18,
    sentiment: 'neutral',
    sources: ['Reddit', 'Quora'],
    relatedTerms: ['billing', 'payments', 'freelance'],
    opportunityScore: 65,
  },
  {
    id: 'trend-6',
    topic: 'Email Marketing for E-commerce',
    category: 'Marketing',
    volume: 11200,
    growth: 25,
    sentiment: 'positive',
    sources: ['Reddit', 'Twitter'],
    relatedTerms: ['klaviyo', 'mailchimp', 'automation'],
    opportunityScore: 70,
  },
  {
    id: 'trend-7',
    topic: 'Video Editing Tools for Content Creators',
    category: 'Development',
    volume: 18500,
    growth: 62,
    sentiment: 'positive',
    sources: ['Reddit', 'YouTube'],
    relatedTerms: ['video', 'editing', 'shorts'],
    opportunityScore: 92,
  },
  {
    id: 'trend-8',
    topic: 'CRM for Solopreneurs',
    category: 'Productivity',
    volume: 7800,
    growth: 35,
    sentiment: 'neutral',
    sources: ['Reddit', 'Indie Hackers'],
    relatedTerms: ['sales', 'leads', 'pipeline'],
    opportunityScore: 75,
  },
  {
    id: 'trend-9',
    topic: 'AI Customer Support Chatbots',
    category: 'AI & Automation',
    volume: 14200,
    growth: 48,
    sentiment: 'positive',
    sources: ['Reddit', 'ProductHunt'],
    relatedTerms: ['chatbot', 'support', 'intercom'],
    opportunityScore: 82,
  },
];

export function getFallbackTrends(): TrendingTopic[] {
  return FALLBACK_TRENDS;
}

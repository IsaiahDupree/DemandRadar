/**
 * NLP Category Detection
 *
 * Client-side heuristics for categorizing market niches and search queries
 */

export interface Category {
  name: string;
  keywords: string[];
  description?: string;
}

/**
 * Predefined market categories with associated keywords
 */
export const MARKET_CATEGORIES: Record<string, Category> = {
  'ai_automation': {
    name: 'AI & Automation',
    keywords: ['ai', 'automation', 'gpt', 'chatbot', 'machine learning', 'automate', 'llm', 'artificial intelligence', 'ml', 'neural'],
    description: 'AI-powered tools and automation solutions',
  },
  'marketing': {
    name: 'Marketing',
    keywords: ['marketing', 'seo', 'ads', 'social', 'content', 'email', 'growth', 'advertising', 'brand', 'campaign'],
    description: 'Marketing and growth tools',
  },
  'productivity': {
    name: 'Productivity',
    keywords: ['productivity', 'task', 'time', 'workflow', 'project', 'organize', 'management', 'todo', 'planning', 'calendar'],
    description: 'Productivity and project management',
  },
  'ecommerce': {
    name: 'E-commerce',
    keywords: ['ecommerce', 'shop', 'store', 'sell', 'dropship', 'retail', 'shopify', 'woocommerce', 'cart', 'checkout'],
    description: 'E-commerce and online retail',
  },
  'finance': {
    name: 'Finance',
    keywords: ['finance', 'payment', 'invoice', 'budget', 'expense', 'money', 'accounting', 'billing', 'payroll', 'tax'],
    description: 'Finance and accounting tools',
  },
  'development': {
    name: 'Development',
    keywords: ['code', 'developer', 'api', 'software', 'app', 'web', 'build', 'programming', 'devops', 'deploy'],
    description: 'Development tools and platforms',
  },
  'health_wellness': {
    name: 'Health & Wellness',
    keywords: ['health', 'fitness', 'wellness', 'mental', 'sleep', 'exercise', 'nutrition', 'therapy', 'meditation', 'workout'],
    description: 'Health and wellness applications',
  },
  'education': {
    name: 'Education',
    keywords: ['learn', 'course', 'education', 'training', 'skill', 'teach', 'tutorial', 'study', 'academic', 'student'],
    description: 'Educational platforms and tools',
  },
  'communication': {
    name: 'Communication',
    keywords: ['chat', 'messaging', 'video', 'call', 'meeting', 'collaboration', 'team', 'slack', 'zoom', 'remote'],
    description: 'Communication and collaboration',
  },
  'design': {
    name: 'Design',
    keywords: ['design', 'graphic', 'ui', 'ux', 'creative', 'figma', 'photo', 'video', 'editing', 'visual'],
    description: 'Design and creative tools',
  },
};

/**
 * Detect the most likely category for a given input text
 */
export function detectCategory(input: string): string {
  const inputLower = input.toLowerCase();

  // Calculate match scores for each category
  const scores: Array<{ category: string; score: number }> = [];

  for (const [key, category] of Object.entries(MARKET_CATEGORIES)) {
    let score = 0;
    for (const keyword of category.keywords) {
      if (inputLower.includes(keyword)) {
        // Longer keywords get higher weight
        score += keyword.length;
      }
    }

    if (score > 0) {
      scores.push({ category: category.name, score });
    }
  }

  // Return the highest scoring category
  if (scores.length > 0) {
    scores.sort((a, b) => b.score - a.score);
    return scores[0].category;
  }

  return 'General';
}

/**
 * Get all categories that match the input (for multi-category detection)
 */
export function detectMultipleCategories(input: string, minScore: number = 3): Array<{ category: string; confidence: number }> {
  const inputLower = input.toLowerCase();
  const results: Array<{ category: string; confidence: number }> = [];

  for (const [key, category] of Object.entries(MARKET_CATEGORIES)) {
    let score = 0;
    let matches = 0;

    for (const keyword of category.keywords) {
      if (inputLower.includes(keyword)) {
        score += keyword.length;
        matches++;
      }
    }

    if (score >= minScore) {
      // Normalize confidence to 0-1
      const confidence = Math.min(1, score / 20);
      results.push({ category: category.name, confidence });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get category suggestions based on partial input
 */
export function getCategorySuggestions(input: string): string[] {
  const categories = detectMultipleCategories(input, 1);
  return categories.slice(0, 3).map(c => c.category);
}

/**
 * Get all available category names
 */
export function getAllCategories(): string[] {
  return Object.values(MARKET_CATEGORIES).map(c => c.name);
}

/**
 * Check if input matches a specific category
 */
export function isInCategory(input: string, categoryName: string): boolean {
  const category = Object.values(MARKET_CATEGORIES).find(c => c.name === categoryName);
  if (!category) return false;

  const inputLower = input.toLowerCase();
  return category.keywords.some(keyword => inputLower.includes(keyword));
}

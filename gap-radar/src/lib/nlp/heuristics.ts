/**
 * NLP Heuristics for Query Suggestions
 *
 * Client-side NLP-style analysis for generating contextual search suggestions
 * These are simple heuristics (v1) - will be upgraded to server-powered NLP in v2
 */

import { detectCategory } from './categories';

export interface Suggestion {
  text: string;
  category: string;
  confidence: number;
  type?: 'refinement' | 'expansion' | 'alternative' | 'original';
}

/**
 * Generate contextual suggestions based on user input
 */
export function generateSuggestions(input: string): Suggestion[] {
  if (!input || input.length < 3) {
    return [];
  }

  const inputLower = input.toLowerCase();
  const suggestions: Suggestion[] = [];
  const detectedCategory = detectCategory(input);

  // 1. Original query with detected category (highest confidence)
  suggestions.push({
    text: input,
    category: detectedCategory,
    confidence: 0.95,
    type: 'original',
  });

  // 2. Alternative/competitor queries
  if (inputLower.includes('alternative')) {
    suggestions.push({
      text: `${input} with better pricing`,
      category: detectedCategory,
      confidence: 0.92,
      type: 'refinement',
    });
    suggestions.push({
      text: `${input} for small teams`,
      category: detectedCategory,
      confidence: 0.85,
      type: 'refinement',
    });
  }

  // 3. Tool/app specific queries
  if (inputLower.includes('tool') || inputLower.includes('app') || inputLower.includes('software')) {
    suggestions.push({
      text: `best ${input} 2025`,
      category: detectedCategory,
      confidence: 0.88,
      type: 'refinement',
    });
    suggestions.push({
      text: `free ${input}`,
      category: detectedCategory,
      confidence: 0.82,
      type: 'alternative',
    });
  }

  // 4. Expand "for" queries with additional context
  if (inputLower.includes('for')) {
    const enhanced = input.replace(/for\s+/i, 'for startups and ');
    if (enhanced !== input) {
      suggestions.push({
        text: enhanced,
        category: detectedCategory,
        confidence: 0.78,
        type: 'expansion',
      });
    }
  }

  // 5. Add year context if not present
  if (!inputLower.includes('2024') && !inputLower.includes('2025') && !inputLower.includes('2026')) {
    suggestions.push({
      text: `${input} 2025`,
      category: detectedCategory,
      confidence: 0.75,
      type: 'refinement',
    });
  }

  // 6. Business model variations
  if (!inputLower.includes('b2b') && !inputLower.includes('b2c')) {
    if (detectedCategory === 'Development' || detectedCategory === 'Productivity' || detectedCategory === 'Marketing') {
      suggestions.push({
        text: `${input} for B2B`,
        category: detectedCategory,
        confidence: 0.80,
        type: 'refinement',
      });
    }
  }

  // 7. Platform-specific suggestions
  if (!inputLower.includes('mobile') && !inputLower.includes('web') && !inputLower.includes('app')) {
    suggestions.push({
      text: `${input} mobile app`,
      category: detectedCategory,
      confidence: 0.72,
      type: 'expansion',
    });
  }

  // 8. Problem-focused variations
  if (!inputLower.includes('problem') && !inputLower.includes('solution')) {
    suggestions.push({
      text: `solving ${input}`,
      category: detectedCategory,
      confidence: 0.70,
      type: 'alternative',
    });
  }

  // Deduplicate by lowercased text
  const unique = suggestions.filter((s, i, arr) =>
    arr.findIndex(x => x.text.toLowerCase() === s.text.toLowerCase()) === i
  );

  // Sort by confidence and limit to top 4
  return unique
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);
}

/**
 * Extract key terms from input for highlighting or related searches
 */
export function extractKeyTerms(input: string): string[] {
  const words = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !STOP_WORDS.includes(w));

  return [...new Set(words)];
}

/**
 * Common English stop words to filter out
 */
const STOP_WORDS = [
  'about', 'above', 'after', 'again', 'against', 'all', 'also', 'and', 'any', 'are',
  'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each',
  'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'here',
  'how', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'more', 'most',
  'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'out', 'over',
  'same', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'them',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
];

/**
 * Infer search intent from the query
 */
export type SearchIntent = 'comparison' | 'alternative' | 'solution' | 'information' | 'general';

export function inferSearchIntent(input: string): SearchIntent {
  const inputLower = input.toLowerCase();

  // Comparison intent
  if (inputLower.includes('vs') || inputLower.includes('versus') || inputLower.includes('compare')) {
    return 'comparison';
  }

  // Alternative intent
  if (inputLower.includes('alternative') || inputLower.includes('instead of') || inputLower.includes('replace')) {
    return 'alternative';
  }

  // Solution intent
  if (inputLower.includes('how to') || inputLower.includes('solve') || inputLower.includes('fix')) {
    return 'solution';
  }

  // Information intent
  if (inputLower.includes('what is') || inputLower.includes('why') || inputLower.includes('explain')) {
    return 'information';
  }

  return 'general';
}

/**
 * Calculate a simple confidence score for the query
 * Based on clarity, specificity, and completeness
 */
export function calculateQueryConfidence(input: string): number {
  let confidence = 0.5; // Base confidence

  // Longer queries are generally more specific
  const wordCount = input.split(/\s+/).length;
  if (wordCount >= 3) confidence += 0.15;
  if (wordCount >= 5) confidence += 0.1;

  // Contains specific keywords
  const hasCategory = detectCategory(input) !== 'General';
  if (hasCategory) confidence += 0.15;

  // Has modifiers (alternative, best, free, etc.)
  const modifiers = ['best', 'top', 'free', 'cheap', 'alternative', 'new', 'affordable'];
  if (modifiers.some(m => input.toLowerCase().includes(m))) {
    confidence += 0.1;
  }

  // Has year/temporal context
  if (/202[4-6]/.test(input)) {
    confidence += 0.05;
  }

  // Penalize very short or vague queries
  if (input.length < 10) confidence -= 0.2;
  if (wordCount === 1) confidence -= 0.15;

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Refine query by removing filler words and normalizing
 */
export function refineQuery(input: string): string {
  let refined = input.trim();

  // Remove common question words at the start
  refined = refined.replace(/^(what|how|why|when|where|who|is|are|can|do|does|should|would|could)\s+/gi, '');

  // Remove trailing question marks
  refined = refined.replace(/\?+$/, '');

  // Normalize whitespace
  refined = refined.replace(/\s+/g, ' ').trim();

  return refined;
}

/**
 * Expand abbreviations and common shorthand
 */
export function expandAbbreviations(input: string): string {
  const expansions: Record<string, string> = {
    'b2b': 'business to business',
    'b2c': 'business to consumer',
    'saas': 'software as a service',
    'crm': 'customer relationship management',
    'erp': 'enterprise resource planning',
    'ai': 'artificial intelligence',
    'ml': 'machine learning',
    'ux': 'user experience',
    'ui': 'user interface',
    'seo': 'search engine optimization',
    'api': 'application programming interface',
  };

  let expanded = input;
  for (const [abbr, full] of Object.entries(expansions)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    expanded = expanded.replace(regex, full);
  }

  return expanded;
}

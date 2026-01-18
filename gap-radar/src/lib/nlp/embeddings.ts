/**
 * NLP Embeddings Service
 *
 * Server-powered NLP using OpenAI embeddings and LLM for:
 * - Keyword expansion
 * - Competitor recognition
 * - Query rewrite
 */

import OpenAI from 'openai';
import { detectCategory } from './categories';
import type { Suggestion } from './heuristics';
import { extractEntities, recognizeCompetitors } from './entities';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NLPSuggestionResponse {
  suggestions: Suggestion[];
  expandedKeywords: string[];
  competitors: string[];
  rewrittenQuery: string;
  category: string;
}

/**
 * In-memory cache for NLP suggestions
 * Key: query (lowercase), Value: { result, timestamp }
 */
const cache = new Map<string, { result: NLPSuggestionResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Generate server-powered NLP suggestions
 */
export async function generateServerSuggestions(query: string): Promise<NLPSuggestionResponse> {
  const cacheKey = query.toLowerCase().trim();

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✅ NLP cache hit for:', query);
    return cached.result;
  }

  console.log('🔍 Generating NLP suggestions for:', query);

  // Detect category using existing heuristics
  const category = detectCategory(query);

  // Extract entities from query
  const entities = extractEntities(query);
  const recognizedCompetitors = recognizeCompetitors(query);

  try {
    // Use LLM to generate comprehensive suggestions
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert market research assistant. Given a user's market research query, generate:
1. 3-5 refined query suggestions (more specific, actionable variations)
2. Expanded keywords (related terms and synonyms)
3. Competitor names (if the query mentions or implies competitors)
4. A rewritten version of the query (optimized for market research)

Return your response as JSON with this exact structure:
{
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "expandedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "competitors": ["Competitor1", "Competitor2"],
  "rewrittenQuery": "optimized query"
}

Rules:
- Suggestions should be 3-7 words each
- expandedKeywords should include 4-8 related terms
- competitors should be actual company/product names (empty array if none apply)
- rewrittenQuery should be clear and specific`
        },
        {
          role: 'user',
          content: `Generate suggestions for this market research query: "${query}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);

    // Transform suggestions into our format
    const suggestions: Suggestion[] = (parsed.suggestions || []).map((text: string, idx: number) => ({
      text,
      category,
      confidence: 0.95 - (idx * 0.05), // Descending confidence
      type: idx === 0 ? 'original' as const : 'refinement' as const
    }));

    // Merge LLM-generated competitors with entity-recognized competitors
    const allCompetitors = Array.from(
      new Set([...(parsed.competitors || []), ...recognizedCompetitors])
    );

    const result: NLPSuggestionResponse = {
      suggestions,
      expandedKeywords: parsed.expandedKeywords || [],
      competitors: allCompetitors,
      rewrittenQuery: parsed.rewrittenQuery || query,
      category
    };

    // Cache the result
    cache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error('❌ Error generating NLP suggestions:', error);

    // Fallback to basic suggestions with entity recognition
    const fallback: NLPSuggestionResponse = {
      suggestions: [
        {
          text: query,
          category,
          confidence: 0.8,
          type: 'original'
        },
        {
          text: `best ${query} 2025`,
          category,
          confidence: 0.75,
          type: 'refinement'
        },
        {
          text: `${query} alternatives`,
          category,
          confidence: 0.7,
          type: 'alternative'
        }
      ],
      expandedKeywords: query.toLowerCase().split(/\s+/).filter(w => w.length > 3),
      competitors: recognizedCompetitors, // Use entity-recognized competitors in fallback
      rewrittenQuery: query,
      category
    };

    return fallback;
  }
}

/**
 * Generate embeddings for a text (for future semantic search)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    throw error;
  }
}

/**
 * Clear the suggestions cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

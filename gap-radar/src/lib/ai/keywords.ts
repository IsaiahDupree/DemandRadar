/**
 * Keyword Recommendations Generator
 *
 * AI-008: Generate top keywords to target based on gap analysis
 * - Keywords ranked
 * - Intent classified
 * - Competition noted
 */

import OpenAI from 'openai';
import { GapOpportunity } from './gap-generator';

export type KeywordIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';
export type CompetitionLevel = 'low' | 'medium' | 'high';

export interface KeywordRecommendation {
  keyword: string;
  score: number;
  intent: KeywordIntent;
  competition: CompetitionLevel;
  competition_reason?: string;
  search_volume?: number;
}

let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// For testing: reset the OpenAI instance
export function resetOpenAIInstance() {
  openaiInstance = null;
}

/**
 * Generate keyword recommendations from gap analysis
 */
export async function generateKeywordRecommendations(
  gaps: GapOpportunity[],
  nicheQuery: string
): Promise<KeywordRecommendation[]> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock keyword recommendations');
    return generateMockKeywordRecommendations(gaps, nicheQuery);
  }

  const topGaps = gaps.slice(0, 5);

  const prompt = `You are an SEO expert. Generate keyword recommendations for: "${nicheQuery}"

TOP MARKET GAPS (use these to inform keyword selection):
${topGaps.map((g, i) => `${i + 1}. ${g.title} (Score: ${g.opportunity_score}/100)
   Problem: ${g.problem}
   Evidence: ${g.evidence_reddit.slice(0, 2).map(e => `"${e.snippet}"`).join(', ')}`).join('\n\n')}

Generate 20 keyword recommendations that:

1. Mix of short-tail (1-2 words) and long-tail (3+ words) keywords
2. Derived from the niche and gap evidence
3. Cover different search intents:
   - informational: how-to, guides, what is
   - commercial: best, top, reviews, alternatives
   - transactional: buy, pricing, plans, sign up
   - navigational: brand names, specific products

4. Estimate competition level (low/medium/high) based on:
   - Keyword specificity (more specific = lower competition)
   - Commercial intent (higher intent = higher competition)
   - Keyword length (longer = typically lower competition)

For each keyword provide:
- keyword: The keyword phrase
- score: Relevance score 0-100 (based on gap alignment)
- intent: informational | commercial | transactional | navigational
- competition: low | medium | high
- competition_reason: Brief explanation of competition level

Sort keywords by score (highest first).

Return JSON following this structure:
{
  "keywords": [
    {
      "keyword": "...",
      "score": 95,
      "intent": "commercial",
      "competition": "medium",
      "competition_reason": "..."
    },
    ...
  ]
}`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert who generates targeted keyword recommendations based on market gaps and user intent. Focus on keywords that align with the gap evidence and have realistic ranking potential.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and normalize the response
    const keywords: KeywordRecommendation[] = (result.keywords || []).map((kw: Record<string, unknown>) => ({
      keyword: kw.keyword as string,
      score: kw.score as number,
      intent: kw.intent as KeywordIntent,
      competition: kw.competition as CompetitionLevel,
      competition_reason: kw.competition_reason as string | undefined,
      search_volume: kw.search_volume as number | undefined,
    }));

    // Sort by score descending
    keywords.sort((a, b) => b.score - a.score);

    return keywords;

  } catch (error) {
    console.error('Error generating keyword recommendations:', error);
    return generateMockKeywordRecommendations(gaps, nicheQuery);
  }
}

/**
 * Generate mock keyword recommendations for testing without API key
 */
function generateMockKeywordRecommendations(
  gaps: GapOpportunity[],
  nicheQuery: string
): KeywordRecommendation[] {
  const topGap = gaps.length > 0 ? gaps[0] : null;
  const secondGap = gaps.length > 1 ? gaps[1] : null;

  const keywords: KeywordRecommendation[] = [];

  // Extract key terms from niche query
  const nicheTerms = nicheQuery.toLowerCase().split(' ');
  const primaryTerm = nicheTerms[0];

  // 1. High-intent transactional keywords (top gap-focused)
  if (topGap) {
    const gapTerms = topGap.title.toLowerCase().split(' ').filter(w => w.length > 3);
    const mainGapTerm = gapTerms[0] || 'feature';

    keywords.push({
      keyword: `${nicheQuery} with ${mainGapTerm}`,
      score: 98,
      intent: 'commercial',
      competition: 'medium',
      competition_reason: 'Specific feature request, moderate search volume',
    });

    keywords.push({
      keyword: `best ${nicheQuery} for ${mainGapTerm}`,
      score: 95,
      intent: 'commercial',
      competition: 'high',
      competition_reason: '"Best" keywords are highly competitive',
    });
  }

  // 2. Core product keywords
  keywords.push({
    keyword: nicheQuery,
    score: 92,
    intent: 'commercial',
    competition: 'high',
    competition_reason: 'Primary keyword, high search volume and competition',
  });

  // Add short-tail keyword (1-2 words)
  keywords.push({
    keyword: primaryTerm,
    score: 91,
    intent: 'navigational',
    competition: 'high',
    competition_reason: 'Single-word keyword, very broad and competitive',
  });

  keywords.push({
    keyword: `best ${nicheQuery}`,
    score: 90,
    intent: 'commercial',
    competition: 'high',
    competition_reason: 'Top commercial keyword with heavy competition',
  });

  keywords.push({
    keyword: `${nicheQuery} pricing`,
    score: 88,
    intent: 'transactional',
    competition: 'medium',
    competition_reason: 'High buyer intent, moderate competition',
  });

  // 3. Comparison keywords
  keywords.push({
    keyword: `${nicheQuery} comparison`,
    score: 85,
    intent: 'commercial',
    competition: 'medium',
    competition_reason: 'Users actively comparing options',
  });

  keywords.push({
    keyword: `${nicheQuery} alternatives`,
    score: 83,
    intent: 'commercial',
    competition: 'medium',
    competition_reason: 'Users looking for alternatives to current solution',
  });

  // 4. Problem-solution keywords (gap-based)
  if (topGap) {
    keywords.push({
      keyword: `how to ${topGap.problem.toLowerCase().replace('users', '').replace('cannot', '').trim().substring(0, 50)}`,
      score: 80,
      intent: 'informational',
      competition: 'low',
      competition_reason: 'Specific problem-focused, lower competition',
    });
  }

  // 5. Feature-specific long-tail keywords
  if (secondGap) {
    const gapTerms = secondGap.title.toLowerCase().split(' ').filter(w => w.length > 3);
    keywords.push({
      keyword: `${nicheQuery} ${gapTerms.join(' ')}`,
      score: 78,
      intent: 'commercial',
      competition: 'low',
      competition_reason: 'Very specific feature request, niche audience',
    });
  }

  // 6. Informational keywords
  keywords.push({
    keyword: `what is ${nicheQuery}`,
    score: 75,
    intent: 'informational',
    competition: 'medium',
    competition_reason: 'Educational content, moderate competition',
  });

  keywords.push({
    keyword: `how to use ${nicheQuery}`,
    score: 72,
    intent: 'informational',
    competition: 'low',
    competition_reason: 'How-to content, lower competition',
  });

  keywords.push({
    keyword: `${nicheQuery} guide`,
    score: 70,
    intent: 'informational',
    competition: 'medium',
    competition_reason: 'Guide content has moderate competition',
  });

  // 7. Use case keywords
  keywords.push({
    keyword: `${nicheQuery} for small business`,
    score: 68,
    intent: 'commercial',
    competition: 'medium',
    competition_reason: 'Specific audience targeting',
  });

  keywords.push({
    keyword: `${nicheQuery} for teams`,
    score: 65,
    intent: 'commercial',
    competition: 'medium',
    competition_reason: 'Team-focused searches have moderate competition',
  });

  // 8. Review and rating keywords
  keywords.push({
    keyword: `${nicheQuery} reviews`,
    score: 63,
    intent: 'commercial',
    competition: 'high',
    competition_reason: 'Review keywords are highly competitive',
  });

  keywords.push({
    keyword: `top ${primaryTerm} tools`,
    score: 60,
    intent: 'commercial',
    competition: 'high',
    competition_reason: 'Broad category keyword with high competition',
  });

  // 9. Long-tail problem-solving keywords
  if (topGap && topGap.problem.length > 10) {
    keywords.push({
      keyword: `${nicheQuery} that ${topGap.problem.toLowerCase().substring(0, 40)}`,
      score: 58,
      intent: 'commercial',
      competition: 'low',
      competition_reason: 'Very specific long-tail keyword',
    });
  }

  // 10. Free/trial keywords
  keywords.push({
    keyword: `free ${nicheQuery}`,
    score: 55,
    intent: 'transactional',
    competition: 'high',
    competition_reason: 'Free keywords attract high competition',
  });

  keywords.push({
    keyword: `${nicheQuery} free trial`,
    score: 53,
    intent: 'transactional',
    competition: 'medium',
    competition_reason: 'Trial keywords have moderate competition',
  });

  // 11. Year-specific keywords
  const currentYear = new Date().getFullYear();
  keywords.push({
    keyword: `best ${nicheQuery} ${currentYear}`,
    score: 50,
    intent: 'commercial',
    competition: 'medium',
    competition_reason: 'Yearly keywords refresh competition annually',
  });

  // Sort by score descending
  keywords.sort((a, b) => b.score - a.score);

  return keywords;
}

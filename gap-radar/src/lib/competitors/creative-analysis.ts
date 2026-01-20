/**
 * Creative Shift Analysis
 * Feature: INTEL-006
 *
 * Uses LLM to analyze if competitors have made significant changes to their
 * messaging, creative style, or positioning based on ad creative comparisons.
 */

import OpenAI from 'openai';

export type ShiftType =
  | 'messaging_change' // New value propositions
  | 'positioning_change' // Target audience shift
  | 'tone_change' // Change in communication style
  | 'major_pivot' // Complete strategy overhaul
  | 'incremental_refinement' // Small improvements
  | 'minor_tweak'; // Barely noticeable changes

export type Significance = 'low' | 'medium' | 'high';

export interface Ad {
  id: string;
  headline: string;
  body?: string;
  run_days?: number;
}

export interface CreativeShiftResult {
  detected: boolean;
  shift_type?: ShiftType;
  summary?: string;
  patterns?: {
    previous_themes?: string[];
    new_themes?: string[];
    previous_tone?: string;
    new_tone?: string;
    previous_audience?: string;
    new_audience?: string;
  };
  significance?: Significance;
  recommendations?: string[];
  error?: string;
  details?: any;
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
 * Analyze if there's a significant creative or messaging shift between
 * previous ads and new ads using GPT-4o-mini.
 *
 * Requires at least 3 new ads for meaningful analysis.
 */
export async function analyzeCreativeShift(
  previousAds: Ad[],
  newAds: Ad[]
): Promise<CreativeShiftResult> {
  // Early returns for edge cases
  if (!process.env.OPENAI_API_KEY) {
    return {
      detected: false,
      summary: 'OpenAI API key not configured',
    };
  }

  if (previousAds.length === 0 || newAds.length < 3) {
    return {
      detected: false,
      summary: 'Insufficient data for analysis (need at least 3 new ads)',
    };
  }

  try {
    const prompt = buildAnalysisPrompt(previousAds, newAds);

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: CREATIVE_SHIFT_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        detected: false,
        error: 'No response from OpenAI',
      };
    }

    const result = JSON.parse(content);

    return {
      detected: result.detected || false,
      shift_type: result.shift_type,
      summary: result.summary,
      patterns: result.patterns,
      significance: result.significance || 'low',
      recommendations: result.recommendations,
      details: result.details,
    };
  } catch (error) {
    console.error('Creative shift analysis error:', error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return {
        detected: false,
        error: 'Failed to parse analysis results',
      };
    }

    return {
      detected: false,
      error: 'Analysis failed',
    };
  }
}

/**
 * Build the analysis prompt with previous and new ads
 */
function buildAnalysisPrompt(previousAds: Ad[], newAds: Ad[]): string {
  const formatAd = (ad: Ad) => {
    const body = ad.body ? `\n  Body: ${ad.body}` : '';
    return `- Headline: ${ad.headline}${body}`;
  };

  const previousAdsText = previousAds
    .slice(0, 5) // Limit to 5 most relevant
    .map(formatAd)
    .join('\n');

  const newAdsText = newAds.map(formatAd).join('\n');

  return `Analyze if there's a significant creative or messaging shift between the previous ads and new ads.

## Previous Ads (baseline messaging):
${previousAdsText}

## New Ads (current messaging):
${newAdsText}

Analyze:
1. Are there significant differences in messaging themes?
2. Has the tone or communication style changed?
3. Is there evidence of targeting a different audience?
4. Are new value propositions being emphasized?
5. Does this represent a strategic shift or just minor iteration?

Provide your analysis in the required JSON format.`;
}

const CREATIVE_SHIFT_SYSTEM_PROMPT = `You are an expert marketing analyst specializing in competitive intelligence and ad creative analysis.

Your task is to analyze ad creative changes and identify significant shifts in messaging, positioning, or strategy.

**Guidelines:**

1. **Pattern Detection**: Look for themes, value propositions, target audiences, and communication styles
2. **Shift Identification**: Determine if changes are strategic (high significance) or tactical (low/medium)
3. **Significance Rating**:
   - **High**: Major pivot (new market, complete messaging overhaul, different positioning)
   - **Medium**: Notable refinement (adjusted value props, tone shift, audience expansion)
   - **Low**: Minor tweaks (wording changes, same core message)

4. **Recommendations**: Provide 1-3 actionable insights based on detected shifts

**Output JSON format:**
{
  "detected": boolean,
  "shift_type": "messaging_change|positioning_change|tone_change|major_pivot|incremental_refinement|minor_tweak",
  "summary": "1-2 sentence description of the shift",
  "patterns": {
    "previous_themes": ["theme1", "theme2"],
    "new_themes": ["theme3", "theme4"],
    "previous_tone": "description",
    "new_tone": "description",
    "previous_audience": "description",
    "new_audience": "description"
  },
  "significance": "low|medium|high",
  "recommendations": ["recommendation1", "recommendation2"],
  "details": {
    "key_differences": ["difference1", "difference2"],
    "consistency_score": 0-100
  }
}

**Important:**
- Set "detected" to false if changes are minimal or just wording variations
- Be specific in your analysis - cite actual messaging differences
- Consider both headlines and body copy
- Focus on strategic implications, not superficial changes`;

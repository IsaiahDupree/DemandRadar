/**
 * AI Copy Generator for Demand Briefs
 *
 * Generates marketing copy from demand signals:
 * - 3 ad hooks
 * - 3 subject lines
 * - 1 landing page paragraph
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CopyGenerationInput {
  offeringName: string;
  topPainPoints: string[];
  topDesires: string[];
  topAngles: string[];
  demandScore: number;
  trend: 'up' | 'down' | 'stable';
}

export interface GeneratedCopy {
  adHooks: string[];
  subjectLines: string[];
  landingParagraph: string;
}

/**
 * Generate all marketing copy for a demand brief
 */
export async function generateCopyForBrief(
  input: CopyGenerationInput
): Promise<GeneratedCopy> {
  console.log(`🎨 Generating copy for ${input.offeringName}...`);

  try {
    const [adHooks, subjectLines, landingParagraph] = await Promise.all([
      generateAdHooks(input),
      generateSubjectLines(input),
      generateLandingParagraph(input),
    ]);

    return {
      adHooks: adHooks.slice(0, 3), // Ensure exactly 3
      subjectLines: padArray(subjectLines.slice(0, 3), 3), // Ensure exactly 3, pad if needed
      landingParagraph,
    };
  } catch (error) {
    console.error('Failed to generate copy:', error);
    return generateFallbackCopy(input);
  }
}

/**
 * Generate 3 attention-grabbing ad hooks
 */
async function generateAdHooks(input: CopyGenerationInput): Promise<string[]> {
  const painPointsList = input.topPainPoints.length
    ? input.topPainPoints.slice(0, 3).join(', ')
    : 'common user frustrations';
  const desiresList = input.topDesires.length
    ? input.topDesires.slice(0, 3).join(', ')
    : 'user goals';
  const anglesList = input.topAngles.length
    ? input.topAngles.slice(0, 3).join(', ')
    : 'effective messaging';

  const prompt = `You are a direct response copywriter creating ad hooks for "${input.offeringName}".

Based on these insights:
- Top pain points: ${painPointsList}
- Top desires: ${desiresList}
- Winning angles in market: ${anglesList}
- Demand score: ${input.demandScore}/100 (${input.trend})

Generate exactly 3 attention-grabbing ad hooks that:
1. Address the pain points directly
2. Promise a clear benefit
3. Create curiosity or urgency
4. Are 10-15 words max
5. Feel native to social media feeds

Return as JSON: {"hooks": ["hook1", "hook2", "hook3"]}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a direct response copywriter. Return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const parsed = JSON.parse(content);
    const hooks = parsed.hooks || [];

    if (!Array.isArray(hooks) || hooks.length < 3) {
      throw new Error('Invalid hooks format');
    }

    return hooks.slice(0, 3);
  } catch (error) {
    console.error('Failed to generate ad hooks:', error);
    return generateFallbackAdHooks(input);
  }
}

/**
 * Generate 3 email subject lines
 */
async function generateSubjectLines(input: CopyGenerationInput): Promise<string[]> {
  const painPointsList = input.topPainPoints.length
    ? input.topPainPoints.slice(0, 3).join(', ')
    : 'user challenges';
  const desiresList = input.topDesires.length
    ? input.topDesires.slice(0, 3).join(', ')
    : 'user aspirations';

  const prompt = `You are an email marketing expert creating subject lines for "${input.offeringName}".

Based on these insights:
- Top pain points: ${painPointsList}
- Top desires: ${desiresList}
- Demand trend: ${input.trend}

Generate exactly 3 compelling email subject lines that:
1. Create curiosity and urgency
2. Promise value or a solution
3. Are 5-8 words max
4. Avoid spam trigger words
5. Test different emotional angles (curiosity, urgency, social proof)

Return as JSON: {"subjectLines": ["subject1", "subject2", "subject3"]}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an email marketing expert. Return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const parsed = JSON.parse(content);
    const subjectLines = parsed.subjectLines || [];

    if (!Array.isArray(subjectLines) || subjectLines.length < 3) {
      throw new Error('Invalid subject lines format');
    }

    return subjectLines.slice(0, 3);
  } catch (error) {
    console.error('Failed to generate subject lines:', error);
    return generateFallbackSubjectLines(input);
  }
}

/**
 * Generate landing page hero paragraph
 */
async function generateLandingParagraph(input: CopyGenerationInput): Promise<string> {
  const painPointsList = input.topPainPoints.length
    ? input.topPainPoints.slice(0, 3).join(', ')
    : 'common challenges';
  const desiresList = input.topDesires.length
    ? input.topDesires.slice(0, 3).join(', ')
    : 'key benefits';

  const prompt = `You are a conversion copywriter creating landing page hero copy for "${input.offeringName}".

Based on these insights:
- Top pain points: ${painPointsList}
- Top desires: ${desiresList}
- Demand score: ${input.demandScore}/100 (${input.trend})

Generate a single compelling hero paragraph (2-3 sentences, ~40 words) that:
1. Immediately addresses the #1 pain point
2. Promises the #1 desired outcome
3. Includes a unique mechanism or proof point
4. Is clear, specific, and benefit-focused

Return as JSON: {"paragraph": "your paragraph here"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a conversion copywriter. Return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const parsed = JSON.parse(content);
    const paragraph = parsed.paragraph;

    if (!paragraph || typeof paragraph !== 'string') {
      throw new Error('Invalid paragraph format');
    }

    return paragraph;
  } catch (error) {
    console.error('Failed to generate landing paragraph:', error);
    return generateFallbackLandingParagraph(input);
  }
}

/**
 * Generate fallback copy when AI fails
 */
function generateFallbackCopy(input: CopyGenerationInput): GeneratedCopy {
  return {
    adHooks: generateFallbackAdHooks(input),
    subjectLines: generateFallbackSubjectLines(input),
    landingParagraph: generateFallbackLandingParagraph(input),
  };
}

function generateFallbackAdHooks(input: CopyGenerationInput): string[] {
  const topPain = input.topPainPoints[0] || 'common challenges';
  const topDesire = input.topDesires[0] || 'better results';

  return [
    `${input.offeringName}: The solution to ${topPain}`,
    `Finally achieve ${topDesire} with ${input.offeringName}`,
    `${input.offeringName} - Join ${input.demandScore}% of satisfied users`,
  ];
}

function generateFallbackSubjectLines(input: CopyGenerationInput): string[] {
  const topDesire = input.topDesires[0] || 'your goals';

  return [
    `Achieve ${topDesire} faster`,
    `Your ${input.offeringName} update is here`,
    `New way to solve ${input.topPainPoints[0] || 'this'}`,
  ];
}

function generateFallbackLandingParagraph(input: CopyGenerationInput): string {
  const topPain = input.topPainPoints[0] || 'common challenges';
  const topDesire = input.topDesires[0] || 'your goals';

  return `${input.offeringName} helps you overcome ${topPain} and achieve ${topDesire}. Join thousands of users who are already seeing results.`;
}

/**
 * Pad array to target length with generic fallback items
 */
function padArray(arr: string[], targetLength: number): string[] {
  const padded = [...arr];
  while (padded.length < targetLength) {
    padded.push(`Option ${padded.length + 1}`);
  }
  return padded;
}

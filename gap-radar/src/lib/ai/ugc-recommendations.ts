/**
 * UGC Recommendations Generator
 *
 * Generates 10 hooks, 5 scripts, and shot list based on UGC pattern analysis.
 * Uses LLM when available, falls back to heuristics otherwise.
 */

import OpenAI from 'openai';
import { UGCAsset, UGCRecommendations } from '../../types';

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
 * Generate UGC recommendations based on analyzed assets
 */
export async function generateUGCRecommendations(
  runId: string,
  assets: UGCAsset[]
): Promise<UGCRecommendations> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using heuristic UGC recommendations');
    return generateHeuristicRecommendations(runId, assets);
  }

  try {
    return await generateLLMRecommendations(runId, assets);
  } catch (error) {
    console.error('LLM recommendation generation error, falling back to heuristics:', error);
    return generateHeuristicRecommendations(runId, assets);
  }
}

/**
 * Generate recommendations using OpenAI LLM
 */
async function generateLLMRecommendations(
  runId: string,
  assets: UGCAsset[]
): Promise<UGCRecommendations> {
  // Prepare asset summary for LLM
  const assetSummary = assets.map((asset, i) => {
    const patterns = asset.patterns;
    const metrics = asset.metrics;

    return `Asset ${i + 1}:
- Caption: "${asset.caption || 'N/A'}"
- Hook Type: ${patterns?.hookType || 'Unknown'}
- Format: ${patterns?.format || 'Unknown'}
- Proof Type: ${patterns?.proofType || 'None'}
- Objection Handled: ${patterns?.objectionHandled || 'None'}
- CTA Style: ${patterns?.ctaStyle || 'None'}
- Performance Score: ${metrics?.score || 'N/A'}
- Views: ${metrics?.views ? metrics.views.toLocaleString() : 'N/A'}`;
  }).join('\n\n');

  const prompt = `Based on these UGC content patterns, generate comprehensive creative recommendations.

ANALYZED CONTENT:
${assetSummary}

Generate the following:

1. **10 HOOKS** - Attention-grabbing opening lines
   - Mix different hook types (POV, pain point, curiosity, authority, etc.)
   - Each should be 8-15 words maximum
   - Format: { "text": "hook text", "type": "hook type" }
   - Prioritize patterns from high-performing content
   - Include variety to test different approaches

2. **5 SCRIPTS** - Full video script outlines
   - Different durations (15s, 30s, 60s variations)
   - Each script should have:
     - duration: "15s" or "30-60s" format
     - outline: array of 3-7 sequential steps
   - Include hooks, proof points, objection handling, and CTAs
   - Match successful patterns from the data

3. **SHOT LIST** - 8-12 specific camera shots/scenes
   - Each shot should describe:
     - shot: what to capture (e.g., "Close-up of hands using app")
     - notes: technical details (e.g., "Screen recording overlay, natural lighting")
   - Cover variety: screen recordings, reactions, demos, before/after, etc.
   - Match formats that worked (demos, comparisons, tutorials, etc.)

4. **ANGLE MAP** - 5-8 messaging angles ranked by priority
   - Each angle should have:
     - angle: the messaging approach (e.g., "Save time automation")
     - priority: "high" | "medium" | "low"
     - reasoning: why this angle matters based on the data

Return ONLY valid JSON in this exact structure:
{
  "hooks": [{ "text": "...", "type": "..." }],
  "scripts": [{ "duration": "...", "outline": ["step1", "step2", ...] }],
  "shotList": [{ "shot": "...", "notes": "..." }],
  "angleMap": [{ "angle": "...", "priority": "...", "reasoning": "..." }]
}`;

  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return generateHeuristicRecommendations(runId, assets);
  }

  const parsed = JSON.parse(content);

  return {
    id: `ugc-rec-${runId}`,
    runId,
    hooks: parsed.hooks || [],
    scripts: parsed.scripts || [],
    shotList: parsed.shotList || [],
    angleMap: parsed.angleMap || [],
  };
}

/**
 * Generate recommendations using heuristics (fallback when no LLM)
 */
function generateHeuristicRecommendations(
  runId: string,
  assets: UGCAsset[]
): UGCRecommendations {
  // Analyze patterns from assets
  const hookTypes = new Map<string, number>();
  const formats = new Map<string, number>();
  const objections = new Map<string, number>();
  const ctaStyles = new Map<string, number>();

  let totalScore = 0;
  let assetCount = 0;

  assets.forEach(asset => {
    if (asset.patterns) {
      const score = asset.metrics?.score || 50;

      // Weight by performance score
      hookTypes.set(
        asset.patterns.hookType,
        (hookTypes.get(asset.patterns.hookType) || 0) + score
      );

      formats.set(
        asset.patterns.format,
        (formats.get(asset.patterns.format) || 0) + score
      );

      if (asset.patterns.objectionHandled) {
        objections.set(
          asset.patterns.objectionHandled,
          (objections.get(asset.patterns.objectionHandled) || 0) + score
        );
      }

      ctaStyles.set(
        asset.patterns.ctaStyle,
        (ctaStyles.get(asset.patterns.ctaStyle) || 0) + score
      );

      totalScore += score;
      assetCount++;
    }
  });

  // Sort by weighted score
  const topHookTypes = Array.from(hookTypes.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);

  const topFormats = Array.from(formats.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([format]) => format);

  const topObjections = Array.from(objections.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([objection]) => objection);

  // Generate 10 hooks based on top patterns
  const hooks = generateHooksFromPatterns(topHookTypes, topObjections);

  // Generate 5 scripts based on top formats
  const scripts = generateScriptsFromPatterns(topFormats, topHookTypes, topObjections);

  // Generate shot list based on top formats
  const shotList = generateShotListFromPatterns(topFormats);

  // Generate angle map based on all patterns
  const angleMap = generateAngleMapFromPatterns(
    topHookTypes,
    topObjections,
    topFormats
  );

  return {
    id: `ugc-rec-${runId}`,
    runId,
    hooks,
    scripts,
    shotList,
    angleMap,
  };
}

/**
 * Generate hook recommendations based on patterns
 */
function generateHooksFromPatterns(
  topHookTypes: string[],
  topObjections: string[]
): { text: string; type: string }[] {
  const hookTemplates: { [key: string]: string[] } = {
    'POV / Relatable': [
      'POV: You finally found a solution that actually works',
      'POV: You discovered the tool everyone\'s gatekeeping',
      'When you realize you\'ve been doing it the hard way',
    ],
    'Pain point callout': [
      'Stop wasting money on tools that don\'t deliver',
      'Tired of complicated software? Try this instead',
      'If you\'re still manually doing this, watch now',
    ],
    'Curiosity / FOMO': [
      'The secret tool professionals don\'t want you to know',
      'Finally discovered why this works better',
      'What I wish I knew before spending $1000',
    ],
    'Authority / Research': [
      'I tested 10 options so you don\'t have to',
      'After comparing everything, here\'s the winner',
      'Professional review: Why this beats the competition',
    ],
    'Myth bust': [
      'The truth about expensive alternatives',
      'Everything they told you was wrong - here\'s why',
      'Myth: You need to spend more for better results',
    ],
    'Feature highlight': [
      'Works offline, no subscription, no hassle',
      'Everything you need without the bloat',
      'One tool that replaces 5 subscriptions',
    ],
    'Hack / Productivity': [
      'The 5-second trick that changes everything',
      'Simple hack that saves 10 hours per week',
      'Productivity tip nobody talks about',
    ],
    'Use case / Scenario': [
      'Perfect for when you need quick results',
      'Use this every time you start a project',
      'Game-changer for busy professionals',
    ],
    'Value proposition': [
      'Better results for half the price',
      'Free alternative that works just as well',
      'Premium features without the premium cost',
    ],
    'Warning / Save money': [
      'Before you pay for that subscription, watch this',
      'Don\'t make this expensive mistake',
      'Warning: Most people overpay for this',
    ],
  };

  const hooks: { text: string; type: string }[] = [];
  const hookTypeOrder = topHookTypes.length > 0 ? topHookTypes : Object.keys(hookTemplates);

  // Generate hooks, prioritizing top-performing types
  let index = 0;
  while (hooks.length < 10) {
    const hookType = hookTypeOrder[index % hookTypeOrder.length];
    const templates = hookTemplates[hookType] || hookTemplates['POV / Relatable'];
    const template = templates[Math.floor(index / hookTypeOrder.length) % templates.length];

    // Add objection reference if we have objections
    let hookText = template;
    if (topObjections.length > 0 && hooks.length % 3 === 0) {
      const objection = topObjections[hooks.length % topObjections.length];
      if (objection === 'Pricing') {
        hookText = hookText.replace('solution', 'affordable solution')
          .replace('tool', 'free tool');
      } else if (objection === 'Ease of use') {
        hookText = hookText.replace('solution', 'simple solution')
          .replace('tool', 'easy tool');
      }
    }

    hooks.push({
      text: hookText,
      type: hookType,
    });

    index++;
  }

  return hooks;
}

/**
 * Generate script recommendations based on patterns
 */
function generateScriptsFromPatterns(
  topFormats: string[],
  topHookTypes: string[],
  topObjections: string[]
): { duration: string; outline: string[] }[] {
  const scripts: { duration: string; outline: string[] }[] = [
    {
      duration: '15s',
      outline: [
        'Hook: Attention-grabbing opener (2s)',
        'Problem: Show the pain point (3s)',
        'Solution: Introduce the product (5s)',
        'CTA: Direct call-to-action (5s)',
      ],
    },
    {
      duration: '30s',
      outline: [
        'Hook: POV or relatable scenario (3s)',
        'Problem: Show current frustration (5s)',
        'Solution reveal: Introduce product/feature (7s)',
        'Proof: Quick demo or results (10s)',
        'CTA: Link in bio or comment (5s)',
      ],
    },
    {
      duration: '30-60s',
      outline: [
        'Hook: Bold claim or question (3s)',
        'Story setup: Relate to audience (7s)',
        'The discovery: How you found this solution (10s)',
        'Demo/Before-After: Show it in action (20s)',
        'Objection handling: Address pricing/ease of use (10s)',
        'Strong CTA: What to do next (10s)',
      ],
    },
    {
      duration: '15-30s',
      outline: [
        'Pattern interrupt: Unexpected hook (3s)',
        'List format: "Here are X things..." (5s)',
        'Quick features: Show 3-5 key benefits (15s)',
        'Close: Save time/money statement + CTA (7s)',
      ],
    },
    {
      duration: '60s',
      outline: [
        'Authority hook: "I tested X tools" (5s)',
        'Setup criteria: What you were looking for (8s)',
        'Comparison: Why others fell short (12s)',
        'The winner reveal: Your top choice (10s)',
        'Deep dive: Show key features (15s)',
        'Results: What happened after using it (7s)',
        'Final CTA: Link and offer (3s)',
      ],
    },
  ];

  // Customize scripts based on top formats
  if (topFormats.includes('Before/After') || topFormats.includes('Comparison')) {
    scripts[2].outline[3] = 'Before/After comparison: Visual proof (20s)';
  }

  if (topFormats.includes('Listicle')) {
    scripts[3].outline[1] = 'List format: "Here are 5 reasons..." (5s)';
  }

  if (topFormats.includes('Tutorial') || topFormats.includes('Demo')) {
    scripts[4].outline[4] = 'Step-by-step demo: Show how it works (15s)';
  }

  // Add objection handling to longer scripts
  if (topObjections.length > 0) {
    const primaryObjection = topObjections[0];
    scripts[2].outline[4] = `Objection handling: Address ${primaryObjection.toLowerCase()} concerns (10s)`;
  }

  return scripts;
}

/**
 * Generate shot list based on formats
 */
function generateShotListFromPatterns(topFormats: string[]): { shot: string; notes: string }[] {
  const baseShotList = [
    {
      shot: 'Close-up of face with reaction',
      notes: 'Natural lighting, show genuine emotion, eye contact with camera',
    },
    {
      shot: 'Screen recording of app/tool',
      notes: 'Clean screen, cursor movements deliberate, highlight key features',
    },
    {
      shot: 'Hands interacting with device',
      notes: 'Over-the-shoulder angle, show real usage, smooth movements',
    },
    {
      shot: 'Text overlay on B-roll',
      notes: 'Large, readable font, stay on screen 3-5s, contrasting colors',
    },
    {
      shot: 'Before/After split screen',
      notes: 'Clear labels, same framing for both, obvious difference',
    },
    {
      shot: 'Product demo - key feature showcase',
      notes: 'Zoom in on important elements, slow motion optional, clear outcome',
    },
    {
      shot: 'Talking head - direct address',
      notes: 'Medium close-up, plain background, good audio quality',
    },
    {
      shot: 'Transition/Reveal moment',
      notes: 'Quick cut or swipe transition, build anticipation, payoff clear',
    },
    {
      shot: 'Social proof - numbers/stats',
      notes: 'Animated text, highlight impressive metrics, source attribution',
    },
    {
      shot: 'Final CTA shot',
      notes: 'Clear text, contrasting button/link, leave on screen 5s minimum',
    },
  ];

  // Customize based on top formats
  if (topFormats.includes('Tutorial')) {
    baseShotList.push({
      shot: 'Step-by-step process overlay',
      notes: 'Number each step, show progression, keep simple',
    });
  }

  if (topFormats.includes('Review')) {
    baseShotList.push({
      shot: 'Rating/Score graphic',
      notes: 'Visual stars or score, comparison to alternatives, trustworthy design',
    });
  }

  return baseShotList.slice(0, 12); // Return up to 12 shots
}

/**
 * Generate angle map with priorities
 */
function generateAngleMapFromPatterns(
  topHookTypes: string[],
  topObjections: string[],
  topFormats: string[]
): { angle: string; priority: 'high' | 'medium' | 'low'; reasoning: string }[] {
  const angles: { angle: string; priority: 'high' | 'medium' | 'low'; reasoning: string }[] = [];

  // High priority angles based on top-performing patterns
  if (topObjections.includes('Pricing')) {
    angles.push({
      angle: 'Free/Affordable alternative',
      priority: 'high',
      reasoning: 'Pricing is a major objection in top-performing content. Position as cost-effective.',
    });
  }

  if (topObjections.includes('Ease of use')) {
    angles.push({
      angle: 'Simple, no learning curve',
      priority: 'high',
      reasoning: 'Ease of use addressed frequently. Emphasize simplicity and quick setup.',
    });
  }

  if (topHookTypes.includes('POV / Relatable')) {
    angles.push({
      angle: 'Relatable user story',
      priority: 'high',
      reasoning: 'POV hooks performed well. Use relatable scenarios and user testimonials.',
    });
  }

  // Medium priority angles
  if (topFormats.includes('Before/After') || topFormats.includes('Comparison')) {
    angles.push({
      angle: 'Visual proof and comparison',
      priority: 'medium',
      reasoning: 'Before/after content resonates. Show tangible improvements visually.',
    });
  }

  if (topHookTypes.includes('Authority / Research')) {
    angles.push({
      angle: 'Expert validation and testing',
      priority: 'medium',
      reasoning: 'Authority-based content builds trust. Reference testing and credentials.',
    });
  }

  // Low priority but worth testing
  angles.push({
    angle: 'Time-saving automation',
    priority: 'medium',
    reasoning: 'Universal appeal. Works across most audiences as secondary benefit.',
  });

  angles.push({
    angle: 'Feature differentiation',
    priority: 'low',
    reasoning: 'Technical features less engaging but important for informed buyers.',
  });

  angles.push({
    angle: 'Social proof and popularity',
    priority: 'medium',
    reasoning: 'Trust signal. Use when you have strong metrics or testimonials.',
  });

  return angles;
}

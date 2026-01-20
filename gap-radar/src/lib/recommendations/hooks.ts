/**
 * Hook Generation from Ads
 * Feature: BUILD-003
 *
 * Analyzes winning ad patterns to generate 5 ad hooks for product ideas.
 * Extracts patterns from long-running ads and categorizes hooks by type.
 */

import OpenAI from 'openai';

export interface WinningAd {
  advertiser: string;
  headline: string;
  primary_text: string;
  run_days: number;
}

export type HookType =
  | 'pain-agitation'
  | 'social-proof'
  | 'time-save'
  | 'outcome'
  | 'curiosity'
  | 'comparison'
  | 'how-to';

export interface GeneratedHook {
  text: string;
  type: HookType;
  reasoning: string;
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
 * Generate 5 ad hooks based on winning ad patterns
 */
export function generateHooks(
  winningAds: WinningAd[],
  productIdea: string
): GeneratedHook[] {
  // Sort ads by run days (longest running = most successful)
  const sortedAds = [...winningAds].sort((a, b) => b.run_days - a.run_days);

  // If no winning ads, generate default hooks
  if (sortedAds.length === 0) {
    return generateDefaultHooks(productIdea);
  }

  // Use OpenAI if available, otherwise use pattern-based generation
  if (process.env.OPENAI_API_KEY) {
    return generateHooksWithAI(sortedAds, productIdea);
  }

  return generateHooksFromPatterns(sortedAds, productIdea);
}

/**
 * Generate hooks using OpenAI for better quality
 */
function generateHooksWithAI(
  winningAds: WinningAd[],
  productIdea: string
): GeneratedHook[] {
  // For now, fall back to pattern-based generation
  // This could be enhanced with actual OpenAI calls
  return generateHooksFromPatterns(winningAds, productIdea);
}

/**
 * Extract patterns from winning ads and generate hooks
 */
function generateHooksFromPatterns(
  winningAds: WinningAd[],
  productIdea: string
): GeneratedHook[] {
  const hooks: GeneratedHook[] = [];

  // Extract key themes from winning ads
  const topAds = winningAds.slice(0, 5);

  // 1. Pain-Agitation Hook
  const painHook = extractPainAgitationHook(topAds, productIdea);
  if (painHook) hooks.push(painHook);

  // 2. Social Proof Hook
  const socialProofHook = extractSocialProofHook(topAds, productIdea);
  if (socialProofHook) hooks.push(socialProofHook);

  // 3. Time-Save Hook
  const timeSaveHook = extractTimeSaveHook(topAds, productIdea);
  if (timeSaveHook) hooks.push(timeSaveHook);

  // 4. Outcome Hook
  const outcomeHook = extractOutcomeHook(topAds, productIdea);
  if (outcomeHook) hooks.push(outcomeHook);

  // 5. Curiosity/Comparison Hook
  const curiosityHook = extractCuriosityHook(topAds, productIdea);
  if (curiosityHook) hooks.push(curiosityHook);

  // Ensure we have exactly 5 hooks
  while (hooks.length < 5) {
    hooks.push(generateGenericHook(productIdea, hooks.length));
  }

  return hooks.slice(0, 5);
}

/**
 * Extract pain-agitation pattern
 */
function extractPainAgitationHook(ads: WinningAd[], productIdea: string): GeneratedHook {
  const painWords = ['stop', 'struggle', 'frustrat', 'waste', 'tired', 'problem', 'difficult'];
  const hasPainPattern = ads.some((ad) =>
    painWords.some(
      (word) =>
        ad.headline.toLowerCase().includes(word) || ad.primary_text.toLowerCase().includes(word)
    )
  );

  const domain = extractDomain(productIdea);

  if (hasPainPattern) {
    return {
      text: `Stop wasting time on ${domain}`,
      type: 'pain-agitation',
      reasoning: `Pattern from winning ads that emphasize pain points and frustrations`,
    };
  }

  return {
    text: `Tired of complicated ${domain}?`,
    type: 'pain-agitation',
    reasoning: `Pain-agitation hook adapted for ${domain} market`,
  };
}

/**
 * Extract social proof pattern
 */
function extractSocialProofHook(ads: WinningAd[], productIdea: string): GeneratedHook {
  const numberPattern = /\d+[,\d]*\+?/g;
  const socialWords = ['users', 'customers', 'companies', 'teams', 'trusted'];

  let userCount: string | null = null;

  for (const ad of ads) {
    const text = `${ad.headline} ${ad.primary_text}`.toLowerCase();
    const numbers = text.match(numberPattern);

    if (numbers && socialWords.some((word) => text.includes(word))) {
      userCount = numbers[0];
      break;
    }
  }

  const domain = extractDomain(productIdea);

  if (userCount) {
    return {
      text: `Join ${userCount} users who transformed their ${domain}`,
      type: 'social-proof',
      reasoning: `Adapted from winning ad pattern showing user count and social proof`,
    };
  }

  return {
    text: `The ${domain} tool trusted by thousands`,
    type: 'social-proof',
    reasoning: `Social proof hook using trust and popularity signals`,
  };
}

/**
 * Extract time-save pattern
 */
function extractTimeSaveHook(ads: WinningAd[], productIdea: string): GeneratedHook {
  const timePattern = /\d+[x\s]*(hours?|minutes?|days?|faster|quicker)/gi;
  const domain = extractDomain(productIdea);

  for (const ad of ads) {
    const text = `${ad.headline} ${ad.primary_text}`;
    const timeMatches = text.match(timePattern);

    if (timeMatches && timeMatches.length > 0) {
      const timePhrase = timeMatches[0];
      return {
        text: `Save ${timePhrase} on ${domain}`,
        type: 'time-save',
        reasoning: `Direct pattern from winning ad emphasizing time savings`,
      };
    }
  }

  return {
    text: `Get ${domain} done in minutes, not hours`,
    type: 'time-save',
    reasoning: `Time-saving hook adapted for ${domain} with proven formula`,
  };
}

/**
 * Extract outcome/transformation pattern
 */
function extractOutcomeHook(ads: WinningAd[], productIdea: string): GeneratedHook {
  const outcomeWords = ['get', 'achieve', 'boost', 'increase', 'grow', 'transform', 'improve'];
  const domain = extractDomain(productIdea);

  for (const ad of ads) {
    const text = ad.headline.toLowerCase();

    for (const word of outcomeWords) {
      if (text.includes(word)) {
        return {
          text: `Transform your ${domain} results`,
          type: 'outcome',
          reasoning: `Outcome-focused hook based on transformation patterns in winning ads`,
        };
      }
    }
  }

  return {
    text: `Finally, ${domain} that delivers real results`,
    type: 'outcome',
    reasoning: `Outcome hook emphasizing results and transformation`,
  };
}

/**
 * Extract curiosity/comparison pattern
 */
function extractCuriosityHook(ads: WinningAd[], productIdea: string): GeneratedHook {
  const curiosityWords = ['secret', 'discover', 'reveal', 'never', 'finally', 'competitor'];
  const domain = extractDomain(productIdea);

  for (const ad of ads) {
    const text = `${ad.headline} ${ad.primary_text}`.toLowerCase();

    for (const word of curiosityWords) {
      if (text.includes(word)) {
        if (word === 'competitor' || text.includes('using')) {
          return {
            text: `The ${domain} tool your competitors are already using`,
            type: 'comparison',
            reasoning: `Comparison hook leveraging competitive FOMO pattern from winning ads`,
          };
        }

        return {
          text: `Discover the ${domain} secret pros don't share`,
          type: 'curiosity',
          reasoning: `Curiosity-driven hook based on patterns in top-performing ads`,
        };
      }
    }
  }

  return {
    text: `What if ${domain} could be 10x easier?`,
    type: 'curiosity',
    reasoning: `Curiosity hook using question format to engage audience`,
  };
}

/**
 * Generate generic hook when patterns aren't strong enough
 */
function generateGenericHook(productIdea: string, index: number): GeneratedHook {
  const domain = extractDomain(productIdea);
  const genericHooks = [
    {
      text: `The smarter way to handle ${domain}`,
      type: 'comparison' as HookType,
      reasoning: `Generic positioning hook for ${domain}`,
    },
    {
      text: `${capitalizeFirst(domain)} made simple`,
      type: 'how-to' as HookType,
      reasoning: `Simplicity-focused hook for ${domain} market`,
    },
    {
      text: `Never worry about ${domain} again`,
      type: 'outcome' as HookType,
      reasoning: `Peace of mind hook for ${domain} solution`,
    },
    {
      text: `Professional ${domain} in minutes`,
      type: 'time-save' as HookType,
      reasoning: `Speed and quality combination hook`,
    },
    {
      text: `The ${domain} upgrade you've been waiting for`,
      type: 'curiosity' as HookType,
      reasoning: `Anticipation-based hook for product launch`,
    },
  ];

  return genericHooks[index % genericHooks.length];
}

/**
 * Generate default hooks when no winning ads are provided
 */
function generateDefaultHooks(productIdea: string): GeneratedHook[] {
  const domain = extractDomain(productIdea);

  return [
    {
      text: `Transform your ${domain} workflow`,
      type: 'outcome',
      reasoning: `Default transformation hook for ${domain}`,
    },
    {
      text: `Join thousands using smarter ${domain}`,
      type: 'social-proof',
      reasoning: `Default social proof hook`,
    },
    {
      text: `Save hours on ${domain} every week`,
      type: 'time-save',
      reasoning: `Default time-saving hook`,
    },
    {
      text: `Stop struggling with ${domain}`,
      type: 'pain-agitation',
      reasoning: `Default pain point hook`,
    },
    {
      text: `The ${domain} solution you've been looking for`,
      type: 'curiosity',
      reasoning: `Default discovery hook`,
    },
  ];
}

/**
 * Extract domain/topic from product idea
 */
function extractDomain(productIdea: string): string {
  const lowerIdea = productIdea.toLowerCase();

  // Common patterns
  const patterns = [
    /for ([\w\s]+)/i,
    /([\w\s]+) tool/i,
    /([\w\s]+) platform/i,
    /([\w\s]+) software/i,
    /([\w\s]+) app/i,
  ];

  for (const pattern of patterns) {
    const match = productIdea.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: use first 2-3 words
  const words = productIdea.split(' ').slice(0, 3);
  return words.join(' ');
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

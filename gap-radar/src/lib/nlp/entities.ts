/**
 * Entity Recognition Service
 *
 * Recognizes competitors, products, and brands in NLP queries
 * Links entities to known brands database for enhanced suggestions
 */

export type EntityType = 'competitor' | 'product' | 'product_category' | 'brand';

export interface Entity {
  name: string;
  type: EntityType;
  confidence: number;
  linked?: boolean;
  category?: string;
}

/**
 * Known SaaS brands database
 * Organized by category for better linking
 */
const KNOWN_BRANDS: Record<string, { category: string; brands: string[] }> = {
  'Project Management': {
    category: 'Productivity',
    brands: ['Asana', 'Trello', 'ClickUp', 'Monday', 'Jira', 'Linear', 'Notion', 'Coda', 'Airtable', 'Basecamp']
  },
  'Communication': {
    category: 'Communication',
    brands: ['Slack', 'Discord', 'Teams', 'Zoom', 'Google Meet', 'Loom', 'Miro', 'Figma']
  },
  'CRM': {
    category: 'Sales',
    brands: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho', 'Zendesk', 'Intercom', 'Freshworks']
  },
  'E-commerce': {
    category: 'E-commerce',
    brands: ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento', 'Wix', 'Squarespace']
  },
  'Payment': {
    category: 'Finance',
    brands: ['Stripe', 'PayPal', 'Square', 'Braintree', 'Adyen']
  },
  'Marketing': {
    category: 'Marketing',
    brands: ['Mailchimp', 'ConvertKit', 'ActiveCampaign', 'Klaviyo', 'Sendinblue', 'HubSpot']
  },
  'Analytics': {
    category: 'Analytics',
    brands: ['Google Analytics', 'Mixpanel', 'Amplitude', 'Segment', 'PostHog', 'Plausible']
  },
  'Design': {
    category: 'Design',
    brands: ['Figma', 'Sketch', 'Adobe XD', 'Canva', 'InVision', 'Framer']
  },
  'Dev Tools': {
    category: 'Development',
    brands: ['GitHub', 'GitLab', 'Bitbucket', 'Vercel', 'Netlify', 'Heroku', 'AWS', 'Supabase', 'Firebase']
  }
};

// Create a flat map for quick lookups (brand -> category)
const BRAND_LOOKUP = new Map<string, string>();
for (const [categoryName, data] of Object.entries(KNOWN_BRANDS)) {
  for (const brand of data.brands) {
    BRAND_LOOKUP.set(brand.toLowerCase(), data.category);
  }
}

// Patterns that indicate entity mentions
const ENTITY_PATTERNS = [
  /alternative(?:s)?\s+to\s+([A-Z][a-zA-Z0-9\.]+)/gi,
  /(?:vs|versus)\s+([A-Z][a-zA-Z0-9\.]+)/gi,
  /([A-Z][a-zA-Z0-9\.]+)\s+(?:vs|versus)/gi,
  /like\s+([A-Z][a-zA-Z0-9\.]+)/gi,
  /better than\s+([A-Z][a-zA-Z0-9\.]+)/gi,
  /instead of\s+([A-Z][a-zA-Z0-9\.]+)/gi,
];

// Common product category abbreviations
const PRODUCT_CATEGORIES = new Map<string, string>([
  ['crm', 'CRM'],
  ['erp', 'ERP'],
  ['cms', 'CMS'],
  ['api', 'API'],
  ['saas', 'SaaS'],
  ['sdk', 'SDK'],
  ['ide', 'IDE'],
]);

/**
 * Extract entities (competitors, products, brands) from a query
 */
export function extractEntities(query: string): Entity[] {
  if (!query || query.length < 2) {
    return [];
  }

  const entities: Entity[] = [];
  const seen = new Set<string>();

  // 1. Extract entities using patterns
  for (const pattern of ENTITY_PATTERNS) {
    const matches = [...query.matchAll(pattern)];
    for (const match of matches) {
      const name = match[1].trim();
      const normalized = name.toLowerCase();

      if (!seen.has(normalized) && name.length > 1) {
        seen.add(normalized);

        // Check if it's a known brand
        const isKnown = BRAND_LOOKUP.has(normalized);

        entities.push({
          name: isKnown ? capitalize(name) : name,
          type: 'competitor',
          confidence: isKnown ? 0.95 : 0.75
        });
      }
    }
  }

  // 2. Look for capitalized words that might be brands
  const words = query.split(/\s+/);
  for (const word of words) {
    const cleaned = word.replace(/[^\w]/g, '');
    if (!cleaned) continue;

    const normalized = cleaned.toLowerCase();

    // Skip if already seen, too short, or is a common word
    if (seen.has(normalized) || cleaned.length < 3) continue;
    if (isCommonWord(normalized)) continue;

    // Check if it's a known brand
    if (BRAND_LOOKUP.has(normalized)) {
      seen.add(normalized);
      entities.push({
        name: capitalize(cleaned),
        type: 'competitor',
        confidence: 0.95
      });
    }
    // Check if it starts with capital (potential brand)
    else if (cleaned[0] === cleaned[0].toUpperCase()) {
      seen.add(normalized);
      entities.push({
        name: cleaned,
        type: 'competitor',
        confidence: 0.6
      });
    }
  }

  // 3. Extract product categories
  const queryLower = query.toLowerCase();
  for (const [abbr, full] of PRODUCT_CATEGORIES) {
    if (queryLower.includes(abbr)) {
      const normalized = abbr.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        entities.push({
          name: full,
          type: 'product_category',
          confidence: 0.9
        });
      }
    }
  }

  return entities.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Recognize competitor names from a query
 * Returns a list of competitor names
 */
export function recognizeCompetitors(query: string): string[] {
  const entities = extractEntities(query);
  const competitors = entities
    .filter(e => e.type === 'competitor')
    .map(e => e.name);

  // Deduplicate case-insensitive
  const uniqueCompetitors = Array.from(
    new Map(competitors.map(c => [c.toLowerCase(), c])).values()
  );

  return uniqueCompetitors;
}

/**
 * Link extracted entities to known brands database
 * Enhances entities with category information and linked status
 */
export function linkToKnownBrands(entities: Entity[]): Entity[] {
  return entities.map(entity => {
    const normalized = entity.name.toLowerCase();
    const category = BRAND_LOOKUP.get(normalized);

    if (category) {
      return {
        ...entity,
        linked: true,
        category,
        confidence: Math.min(1.0, entity.confidence + 0.1) // Boost confidence for known brands
      };
    }

    return {
      ...entity,
      linked: false
    };
  });
}

/**
 * Helper: Capitalize first letter of a string
 */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Helper: Check if a word is a common English word (not a brand)
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'about', 'into', 'through',
    'best', 'good', 'better', 'great', 'top', 'new', 'free', 'cheap',
    'software', 'tool', 'app', 'service', 'platform', 'solution',
    'alternative', 'compare', 'comparison', 'versus',
    'small', 'large', 'big', 'easy', 'simple', 'fast', 'quick',
    'business', 'team', 'company', 'startup', 'enterprise',
    'online', 'cloud', 'web', 'mobile', 'desktop',
    'management', 'marketing', 'sales', 'customer', 'project'
  ]);

  return commonWords.has(word.toLowerCase());
}

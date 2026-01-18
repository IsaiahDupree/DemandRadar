/**
 * Web Competitor Search Collector
 *
 * Searches for web-based competitors in a niche for platform gap analysis.
 * Uses SerpAPI to find top competitors and extracts key information.
 */

export interface WebCompetitor {
  name: string;
  url: string;
  description?: string;
  features?: string[];
  pricing?: {
    model: 'free' | 'freemium' | 'subscription' | 'one-time' | 'custom' | 'unknown';
    startingPrice?: number;
    currency?: string;
  };
  category?: string;
}

/**
 * Search for web-based competitors in a given niche
 * @param niche - The niche or product category to search for
 * @param limit - Maximum number of competitors to return (default: 10)
 * @returns Array of web competitors
 */
export async function searchWebCompetitors(
  niche: string,
  limit: number = 10
): Promise<WebCompetitor[]> {
  // Handle empty/invalid input
  if (!niche || niche.trim().length === 0) {
    return [];
  }

  try {
    // In a real implementation, this would use SerpAPI or similar service
    // For now, we'll use a mock implementation that simulates the API
    const searchQuery = `best ${niche} tools alternatives`;

    // Mock data for testing - in production this would be real API call
    const mockCompetitors: WebCompetitor[] = await fetchCompetitorsFromSearch(searchQuery, limit);

    // Deduplicate by URL
    const uniqueCompetitors = deduplicateByUrl(mockCompetitors);

    return uniqueCompetitors.slice(0, limit);
  } catch (error) {
    console.error('Error searching web competitors:', error);
    return [];
  }
}

/**
 * Fetch competitors from search results
 * In production, this would call SerpAPI or similar service
 */
async function fetchCompetitorsFromSearch(
  query: string,
  limit: number
): Promise<WebCompetitor[]> {
  // Mock implementation for testing
  // In production, replace with actual SerpAPI call:
  // const response = await fetch(`https://serpapi.com/search?q=${query}&api_key=${process.env.SERPAPI_KEY}`);

  const mockResults: WebCompetitor[] = [
    {
      name: 'CompetitorApp',
      url: 'https://competitorapp.com',
      description: 'A leading solution in the market',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      pricing: {
        model: 'freemium',
        startingPrice: 9.99,
        currency: 'USD',
      },
      category: 'SaaS',
    },
    {
      name: 'AlternativeTool',
      url: 'https://alternativetool.com',
      description: 'Another popular option',
      features: ['Advanced analytics', 'Team collaboration'],
      pricing: {
        model: 'subscription',
        startingPrice: 19.99,
        currency: 'USD',
      },
      category: 'SaaS',
    },
    {
      name: 'FreeSolution',
      url: 'https://freesolution.com',
      description: 'Open source alternative',
      features: ['Self-hosted', 'Customizable'],
      pricing: {
        model: 'free',
      },
      category: 'Open Source',
    },
  ];

  return mockResults.slice(0, limit);
}

/**
 * Remove duplicate competitors by URL
 */
function deduplicateByUrl(competitors: WebCompetitor[]): WebCompetitor[] {
  const seen = new Set<string>();
  return competitors.filter(competitor => {
    if (seen.has(competitor.url)) {
      return false;
    }
    seen.add(competitor.url);
    return true;
  });
}

/**
 * Extract features from competitor website or description
 * This would typically use web scraping or AI extraction
 */
export function extractFeatures(description: string): string[] {
  // Simple implementation - in production would use AI/NLP
  const features: string[] = [];

  // Look for common feature indicators
  const featureKeywords = [
    'feature', 'includes', 'offers', 'provides',
    'integrates', 'supports', 'enables', 'allows'
  ];

  const sentences = description.split(/[.!?]+/);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (featureKeywords.some(keyword => lower.includes(keyword))) {
      // Extract the feature
      const cleaned = sentence.trim();
      if (cleaned.length > 0 && cleaned.length < 200) {
        features.push(cleaned);
      }
    }
  }

  return features.slice(0, 10); // Limit to 10 features
}

/**
 * Infer pricing model from description or website content
 */
export function inferPricingModel(text: string): WebCompetitor['pricing'] {
  const lower = text.toLowerCase();

  if (lower.includes('free') && !lower.includes('trial')) {
    return { model: 'free' };
  }

  if (lower.includes('freemium') || (lower.includes('free') && lower.includes('paid'))) {
    return { model: 'freemium' };
  }

  if (lower.includes('subscription') || lower.includes('monthly') || lower.includes('yearly')) {
    return { model: 'subscription' };
  }

  if (lower.includes('one-time') || lower.includes('lifetime')) {
    return { model: 'one-time' };
  }

  if (lower.includes('custom') || lower.includes('contact') || lower.includes('enterprise')) {
    return { model: 'custom' };
  }

  return { model: 'unknown' };
}

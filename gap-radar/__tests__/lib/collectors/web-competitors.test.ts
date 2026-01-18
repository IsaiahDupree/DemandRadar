import { searchWebCompetitors, WebCompetitor } from '@/lib/collectors/web-competitors';

describe('Web Competitor Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns top web competitors for a niche', async () => {
    const competitors = await searchWebCompetitors('project management tools');

    expect(Array.isArray(competitors)).toBe(true);
    expect(competitors.length).toBeGreaterThan(0);
  });

  it('returns competitor with name and url', async () => {
    const competitors = await searchWebCompetitors('AI writing tools');

    expect(competitors[0]).toHaveProperty('name');
    expect(competitors[0]).toHaveProperty('url');
    expect(typeof competitors[0].name).toBe('string');
    expect(typeof competitors[0].url).toBe('string');
  });

  it('extracts key features from competitors', async () => {
    const competitors = await searchWebCompetitors('CRM software');

    // At least one competitor should have features
    const competitorsWithFeatures = competitors.filter(c => c.features && c.features.length > 0);
    expect(competitorsWithFeatures.length).toBeGreaterThan(0);
  });

  it('includes pricing data when available', async () => {
    const competitors = await searchWebCompetitors('email marketing tools');

    // Some competitors might have pricing data
    const competitorsWithPricing = competitors.filter(c => c.pricing);

    // If pricing exists, it should have structure
    competitorsWithPricing.forEach(competitor => {
      expect(competitor.pricing).toHaveProperty('model');
      // Model could be 'freemium', 'subscription', 'one-time', etc.
      expect(typeof competitor.pricing!.model).toBe('string');
    });
  });

  it('includes description when available', async () => {
    const competitors = await searchWebCompetitors('fitness apps');

    const competitorsWithDescription = competitors.filter(c => c.description);
    expect(competitorsWithDescription.length).toBeGreaterThan(0);
  });

  it('limits results to reasonable number', async () => {
    const competitors = await searchWebCompetitors('productivity software');

    // Should return manageable number of results (e.g., 5-20)
    expect(competitors.length).toBeLessThanOrEqual(20);
    expect(competitors.length).toBeGreaterThan(0);
  });

  it('handles empty/invalid niche gracefully', async () => {
    const competitors = await searchWebCompetitors('');

    expect(Array.isArray(competitors)).toBe(true);
    expect(competitors.length).toBe(0);
  });

  it('returns unique competitors (no duplicates)', async () => {
    const competitors = await searchWebCompetitors('note taking apps');

    const urls = competitors.map(c => c.url);
    const uniqueUrls = new Set(urls);

    expect(uniqueUrls.size).toBe(urls.length);
  });
});

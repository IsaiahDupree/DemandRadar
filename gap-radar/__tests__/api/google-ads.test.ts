/**
 * Google Ads API Endpoint Tests
 *
 * Tests the GET /api/google-ads endpoint
 * @jest-environment node
 */

import { GET } from '@/app/api/google-ads/route';
import { NextRequest } from 'next/server';

// Mock the Google collector
jest.mock('@/lib/collectors/google', () => ({
  collectGoogleAds: jest.fn(),
}));

import { collectGoogleAds } from '@/lib/collectors/google';

const mockCollectGoogleAds = collectGoogleAds as jest.MockedFunction<typeof collectGoogleAds>;

describe('GET /api/google-ads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return Google ads data for a query', async () => {
    const mockAds = [
      {
        source: 'google' as const,
        advertiser_name: 'TestAdvertiser',
        headline: 'Best AI Tool',
        description: 'Revolutionary AI solution',
        display_url: 'www.test.com',
        ad_type: 'search' as const,
        keywords: ['AI tools'],
      },
    ];

    mockCollectGoogleAds.mockResolvedValue(mockAds);

    const request = new NextRequest('http://localhost:3001/api/google-ads?query=AI+tools');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ads).toHaveLength(1);
    expect(data.ads[0].advertiser_name).toBe('TestAdvertiser');
    expect(data.query).toBe('AI tools');
    expect(mockCollectGoogleAds).toHaveBeenCalledWith('AI tools', [], {});
  });

  it('should return 400 if query parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3001/api/google-ads');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Query parameter is required');
  });

  it('should handle seed terms parameter', async () => {
    mockCollectGoogleAds.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3001/api/google-ads?query=AI+tools&seedTerms=chatbot,automation');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCollectGoogleAds).toHaveBeenCalledWith('AI tools', ['chatbot', 'automation'], {});
  });

  it('should handle country and language options', async () => {
    mockCollectGoogleAds.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3001/api/google-ads?query=AI+tools&country=uk&language=en');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCollectGoogleAds).toHaveBeenCalledWith('AI tools', [], {
      country: 'uk',
      language: 'en',
    });
  });

  it('should handle limit option', async () => {
    mockCollectGoogleAds.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3001/api/google-ads?query=AI+tools&limit=10');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCollectGoogleAds).toHaveBeenCalledWith('AI tools', [], {
      limit: 10,
    });
  });

  it('should handle errors gracefully', async () => {
    mockCollectGoogleAds.mockRejectedValue(new Error('API error'));

    const request = new NextRequest('http://localhost:3001/api/google-ads?query=AI+tools');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch Google ads');
  });

  it('should include metadata in response', async () => {
    mockCollectGoogleAds.mockResolvedValue([
      {
        source: 'google' as const,
        advertiser_name: 'TestAdvertiser',
        headline: 'Best AI Tool',
        description: 'Revolutionary AI solution',
        display_url: 'www.test.com',
        ad_type: 'search' as const,
        keywords: ['AI tools'],
      },
    ]);

    const request = new NextRequest('http://localhost:3001/api/google-ads?query=AI+tools');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.query).toBe('AI tools');
    expect(data.count).toBe(1);
    expect(data.timestamp).toBeDefined();
  });

  it('should return empty array if no ads found', async () => {
    mockCollectGoogleAds.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3001/api/google-ads?query=obscure+term+12345');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ads).toEqual([]);
    expect(data.count).toBe(0);
  });
});

/**
 * TikTok UGC API Endpoint Tests
 *
 * Tests the GET /api/ugc/tiktok endpoint
 * @jest-environment node
 */

import { GET } from '@/app/api/ugc/tiktok/route';
import { NextRequest } from 'next/server';

// Mock the TikTok collector
jest.mock('@/lib/collectors/tiktok', () => ({
  collectTikTokUGC: jest.fn(),
}));

import { collectTikTokUGC } from '@/lib/collectors/tiktok';

const mockCollectTikTokUGC = collectTikTokUGC as jest.MockedFunction<typeof collectTikTokUGC>;

describe('GET /api/ugc/tiktok', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return TikTok UGC data for a query', async () => {
    const mockResults = [
      {
        asset: {
          source: 'tiktok_top_ads' as const,
          platform: 'tiktok' as const,
          video_id: 'test123',
          url: 'https://www.tiktok.com/@creator/video/test123',
          caption: 'Test caption',
          hashtags: ['test'],
        },
        metrics: {
          views: 100000,
          likes: 5000,
          comments: 200,
          shares: 100,
        },
      },
    ];

    mockCollectTikTokUGC.mockResolvedValue(mockResults);

    const request = new NextRequest('http://localhost:3001/api/ugc/tiktok?query=AI+tools');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].asset.video_id).toBe('test123');
    expect(data.query).toBe('AI tools');
    expect(mockCollectTikTokUGC).toHaveBeenCalledWith('AI tools', []);
  });

  it('should return 400 if query parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3001/api/ugc/tiktok');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Query parameter is required');
  });

  it('should handle seed terms parameter', async () => {
    mockCollectTikTokUGC.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3001/api/ugc/tiktok?query=AI+tools&seedTerms=chatbot,automation');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCollectTikTokUGC).toHaveBeenCalledWith('AI tools', ['chatbot', 'automation']);
  });

  it('should handle errors gracefully', async () => {
    mockCollectTikTokUGC.mockRejectedValue(new Error('API error'));

    const request = new NextRequest('http://localhost:3001/api/ugc/tiktok?query=AI+tools');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch TikTok UGC data');
  });

  it('should include metadata in response', async () => {
    const mockResults = [
      {
        asset: {
          source: 'tiktok_top_ads' as const,
          platform: 'tiktok' as const,
          video_id: 'test123',
          url: 'https://www.tiktok.com/@creator/video/test123',
        },
      },
    ];

    mockCollectTikTokUGC.mockResolvedValue(mockResults);

    const request = new NextRequest('http://localhost:3001/api/ugc/tiktok?query=AI+tools');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.query).toBe('AI tools');
    expect(data.count).toBe(1);
    expect(data.timestamp).toBeDefined();
  });

  it('should return empty array if no UGC found', async () => {
    mockCollectTikTokUGC.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:3001/api/ugc/tiktok?query=obscure+term+12345');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
    expect(data.count).toBe(0);
  });

  it('should include pattern extraction info in response', async () => {
    const mockResults = [
      {
        asset: {
          source: 'tiktok_top_ads' as const,
          platform: 'tiktok' as const,
          video_id: 'test123',
          url: 'https://www.tiktok.com/@creator/video/test123',
          caption: 'POV: You found the best AI tool',
        },
        pattern: {
          hook_type: 'POV',
          format: 'selfie_ugc',
          proof_type: 'demo',
          cta_style: 'link_in_bio',
        },
      },
    ];

    mockCollectTikTokUGC.mockResolvedValue(mockResults);

    const request = new NextRequest('http://localhost:3001/api/ugc/tiktok?query=AI+tools');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results[0].pattern).toBeDefined();
    expect(data.results[0].pattern.hook_type).toBe('POV');
  });

  it('should handle multiple results with different sources', async () => {
    const mockResults = [
      {
        asset: {
          source: 'tiktok_top_ads' as const,
          platform: 'tiktok' as const,
          video_id: 'test1',
          url: 'https://www.tiktok.com/@creator1/video/test1',
        },
      },
      {
        asset: {
          source: 'tiktok_trend' as const,
          platform: 'tiktok' as const,
          video_id: 'test2',
          url: 'https://www.tiktok.com/@creator2/video/test2',
        },
      },
    ];

    mockCollectTikTokUGC.mockResolvedValue(mockResults);

    const request = new NextRequest('http://localhost:3001/api/ugc/tiktok?query=AI+tools');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(2);
    expect(data.results[0].asset.source).toBe('tiktok_top_ads');
    expect(data.results[1].asset.source).toBe('tiktok_trend');
  });
});

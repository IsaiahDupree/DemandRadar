/**
 * YouTube Demand API Integration Tests
 *
 * Tests for /api/demand/youtube endpoint (UDS-002)
 */

import { GET } from '@/app/api/demand/youtube/route';
import { NextRequest } from 'next/server';

// Mock the YouTube collectors
jest.mock('@/lib/collectors/youtube', () => ({
  collectYouTubeUGC: jest.fn(),
  searchYouTubeVideos: jest.fn(),
}));

describe('GET /api/demand/youtube', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if niche is missing', async () => {
    const request = new NextRequest('http://localhost:3001/api/demand/youtube');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Niche is required');
  });

  it('returns content score for valid niche', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/youtube?niche=crm+software'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('niche', 'crm software');
    expect(data).toHaveProperty('content_score');
    expect(data.content_score).toBeGreaterThanOrEqual(0);
    expect(data.content_score).toBeLessThanOrEqual(100);
  });

  it('returns breakdown of score components', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/youtube?niche=project+management'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.breakdown).toBeDefined();
    expect(data.breakdown).toHaveProperty('velocity_score');
    expect(data.breakdown).toHaveProperty('question_score');
    expect(data.breakdown).toHaveProperty('gap_score');
    expect(data.breakdown.weights).toEqual({
      velocity: 0.4,
      questions: 0.3,
      gaps: 0.3,
    });
  });

  it('returns YouTube data metrics', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/youtube?niche=email+marketing'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.data).toBeDefined();
    expect(data.data).toHaveProperty('avgViews');
    expect(data.data).toHaveProperty('totalComments');
    expect(data.data).toHaveProperty('totalVideos');
    expect(data.data).toHaveProperty('questionComments');
  });

  it('returns content gaps analysis', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/youtube?niche=seo+tools'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.content_gaps).toBeDefined();
    expect(data.content_gaps).toHaveProperty('missing');
    expect(data.content_gaps).toHaveProperty('details');
    expect(Array.isArray(data.content_gaps.missing)).toBe(true);
  });

  it('returns sample question comments', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/youtube?niche=productivity+apps'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.sample_questions).toBeDefined();
    expect(Array.isArray(data.sample_questions)).toBe(true);
    expect(data.sample_questions.length).toBeLessThanOrEqual(5);
  });

  it('accepts optional maxVideos parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/youtube?niche=task+management&maxVideos=10'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.maxVideos).toBe(10);
  });

  it('accepts optional seedTerms parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/youtube?niche=analytics&seedTerms=data+analytics,business+intelligence'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.meta.seedTerms).toEqual(['data analytics', 'business intelligence']);
  });

  it('returns timestamp in meta', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/youtube?niche=sales+automation'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.meta).toHaveProperty('collected_at');
    expect(new Date(data.meta.collected_at).toString()).not.toBe('Invalid Date');
  });

  it('handles errors gracefully', async () => {
    // Mock collector to throw error
    const { collectYouTubeUGC } = require('@/lib/collectors/youtube');
    collectYouTubeUGC.mockRejectedValueOnce(new Error('API error'));

    const request = new NextRequest(
      'http://localhost:3001/api/demand/youtube?niche=test'
    );
    const response = await GET(request);

    // Should still return 200 with mock data fallback
    expect(response.status).toBe(200);
  });

  it('filters question comments correctly', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/youtube?niche=video+editing'
    );
    const response = await GET(request);
    const data = await response.json();

    // All sample questions should have question indicators
    for (const question of data.sample_questions) {
      const hasQuestionIndicator =
        question.includes('?') ||
        /\b(how|what|where|why|when)\b/i.test(question);
      expect(hasQuestionIndicator).toBe(true);
    }
  });
});

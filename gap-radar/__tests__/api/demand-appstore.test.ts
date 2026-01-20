/**
 * App Store API Endpoint Tests
 * Tests for /api/demand/appstore
 */

import { GET } from '@/app/api/demand/appstore/route';
import { NextRequest } from 'next/server';

describe('GET /api/demand/appstore', () => {
  it('should return 400 if niche is missing', async () => {
    const request = new NextRequest('http://localhost:3001/api/demand/appstore');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Niche is required');
  });

  it('should return app score data for valid niche', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/appstore?niche=todo+app'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('niche');
    expect(data).toHaveProperty('app_score');
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('breakdown');
    expect(data).toHaveProperty('meta');
  });

  it('should return app_score between 0 and 100', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/appstore?niche=fitness+tracker'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.app_score).toBeGreaterThanOrEqual(0);
    expect(data.app_score).toBeLessThanOrEqual(100);
  });

  it('should include breakdown with correct weights', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/appstore?niche=budget+app'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.breakdown.weights).toEqual({
      downloads: 0.3,
      negativeReviews: 0.3,
      featureRequests: 0.4,
    });
  });

  it('should include apps data with platform info', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/appstore?niche=notes+app'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(Array.isArray(data.data.apps)).toBe(true);

    if (data.data.apps.length > 0) {
      const app = data.data.apps[0];
      expect(app).toHaveProperty('name');
      expect(app).toHaveProperty('platform');
      expect(app).toHaveProperty('rating');
      expect(app).toHaveProperty('reviewCount');
    }
  });

  it('should filter by platform when specified', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/appstore?niche=weather+app&platform=ios'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.meta.platform).toBe('ios');

    // All apps should be iOS if any are returned
    if (data.data.apps.length > 0) {
      data.data.apps.forEach((app: { platform: string }) => {
        expect(app.platform).toBe('ios');
      });
    }
  });

  it('should respect limit parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/appstore?niche=calculator&limit=5'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.data.apps.length).toBeLessThanOrEqual(5);
  });

  it('should include collection timestamp', async () => {
    const request = new NextRequest(
      'http://localhost:3001/api/demand/appstore?niche=timer'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.meta.collected_at).toBeTruthy();
    const timestamp = new Date(data.meta.collected_at);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
  });
});

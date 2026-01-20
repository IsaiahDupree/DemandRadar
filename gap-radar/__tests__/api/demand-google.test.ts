/**
 * Google Demand API Tests
 *
 * Tests for /api/demand/google endpoint (UDS-001)
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/demand/google/route';

describe('/api/demand/google', () => {
  describe('GET', () => {
    it('returns 400 if niche is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/demand/google');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('returns search score for valid niche', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/demand/google?niche=project+management'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.niche).toBe('project management');
      expect(data.search_score).toBeDefined();
      expect(data.search_score).toBeGreaterThanOrEqual(0);
      expect(data.search_score).toBeLessThanOrEqual(100);
    });

    it('includes trend data in response', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/demand/google?niche=crm+software'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(data.data.searchVolume).toBeDefined();
      expect(data.data.growthRate).toBeDefined();
      expect(data.data.relatedQueries).toBeDefined();
      expect(Array.isArray(data.data.relatedQueries)).toBe(true);
    });

    it('includes breakdown of score components', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/demand/google?niche=email+marketing'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.breakdown).toBeDefined();
      expect(data.breakdown.volume_score).toBeDefined();
      expect(data.breakdown.growth_score).toBeDefined();
      expect(data.breakdown.intent_score).toBeDefined();
    });

    it('handles URL-encoded niches', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/demand/google?niche=project%20management%20tool'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.niche).toBe('project management tool');
    });

    it('returns reasonable mock data when API is not configured', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/demand/google?niche=test'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.search_score).toBeGreaterThan(0);
      expect(data.data.searchVolume).toBeGreaterThan(0);
    });
  });
});

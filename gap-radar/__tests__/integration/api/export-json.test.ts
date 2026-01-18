/**
 * JSON Export API Tests
 *
 * Tests for GET /api/reports/[runId]/export/json
 * @jest-environment node
 */

import { createMocks } from 'node-mocks-http';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/reports/[runId]/export/json/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-123' } },
        error: null,
      })),
    },
    from: jest.fn((table: string) => {
      const mockData: Record<string, any> = {
        runs: {
          data: {
            id: 'test-run-123',
            niche_query: 'AI productivity tools',
            seed_terms: ['AI', 'productivity'],
            competitors: ['Notion', 'Asana'],
            geo: 'US',
            run_type: 'deep',
            status: 'complete',
            scores: { opportunity_score: 85, confidence: 0.9 },
            three_percent_better_plans: null,
            created_at: '2026-01-01T00:00:00Z',
            started_at: '2026-01-01T00:01:00Z',
            finished_at: '2026-01-01T00:05:00Z',
          },
          error: null,
        },
        ad_creatives: {
          data: [
            {
              id: 'ad-1',
              advertiser_name: 'TestCo',
              creative_text: 'Test ad',
              headline: 'Test Headline',
            },
          ],
          error: null,
        },
        reddit_mentions: {
          data: [
            {
              id: 'mention-1',
              subreddit: 'test',
              title: 'Test post',
            },
          ],
          error: null,
        },
        clusters: {
          data: [
            {
              id: 'cluster-1',
              cluster_type: 'angle',
              label: 'Test cluster',
            },
          ],
          error: null,
        },
        gap_opportunities: {
          data: [
            {
              id: 'gap-1',
              title: 'Test gap',
              opportunity_score: 80,
            },
          ],
          error: null,
        },
        concept_ideas: {
          data: [
            {
              id: 'concept-1',
              name: 'Test concept',
              concept_metrics: [],
            },
          ],
          error: null,
        },
        extractions: { data: [], error: null },
        app_store_results: { data: [], error: null },
        ugc_recommendations: { data: null, error: null },
        action_plans: { data: null, error: null },
      };

      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              table === 'runs'
                ? mockData.runs
                : table === 'ugc_recommendations' || table === 'action_plans'
                ? mockData[table]
                : { data: null, error: null }
            ),
            order: jest.fn(() => mockData[table]),
            data: mockData[table]?.data,
            error: mockData[table]?.error,
          })),
          single: jest.fn(() => mockData[table]),
        })),
      };
    }),
  })),
}));

describe('JSON Export API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/[runId]/export/json', () => {
    it('should return JSON export with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);

      const data = await response.json();

      // Verify top-level structure
      expect(data).toHaveProperty('meta');
      expect(data).toHaveProperty('run');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('insights');
      expect(data).toHaveProperty('statistics');
    });

    it('should include meta information', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.meta).toMatchObject({
        runId: 'test-run-123',
        nicheName: 'AI productivity tools',
        status: 'complete',
        version: '1.0.0',
      });
      expect(data.meta.exportedAt).toBeDefined();
    });

    it('should include run details', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.run).toMatchObject({
        id: 'test-run-123',
        niche_query: 'AI productivity tools',
        seed_terms: ['AI', 'productivity'],
        competitors: ['Notion', 'Asana'],
        geo: 'US',
        run_type: 'deep',
        status: 'complete',
      });
    });

    it('should include all data tables', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.data).toHaveProperty('ads');
      expect(data.data).toHaveProperty('reddit_mentions');
      expect(data.data).toHaveProperty('clusters');
      expect(data.data).toHaveProperty('extractions');
      expect(data.data).toHaveProperty('app_store_results');

      expect(Array.isArray(data.data.ads)).toBe(true);
      expect(Array.isArray(data.data.reddit_mentions)).toBe(true);
    });

    it('should include insights', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.insights).toHaveProperty('gap_opportunities');
      expect(data.insights).toHaveProperty('concept_ideas');
      expect(data.insights).toHaveProperty('ugc_recommendations');
      expect(data.insights).toHaveProperty('action_plan');

      expect(Array.isArray(data.insights.gap_opportunities)).toBe(true);
      expect(Array.isArray(data.insights.concept_ideas)).toBe(true);
    });

    it('should include statistics', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const data = await response.json();

      expect(data.statistics).toHaveProperty('total_ads');
      expect(data.statistics).toHaveProperty('total_mentions');
      expect(data.statistics).toHaveProperty('total_gaps');
      expect(data.statistics).toHaveProperty('total_concepts');
      expect(data.statistics).toHaveProperty('total_clusters');
      expect(data.statistics).toHaveProperty('unique_advertisers');
      expect(data.statistics).toHaveProperty('platforms_analyzed');

      expect(typeof data.statistics.total_ads).toBe('number');
    });

    it('should set correct content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should set content-disposition header with filename', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('gapradar-');
      expect(disposition).toContain('.json');
      expect(disposition).toContain('ai-productivity-tools');
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Mock unauthenticated user
      const { createClient } = await import('@/lib/supabase/server');
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn(() => ({
            data: { user: null },
            error: null,
          })),
        },
      }));

      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent run', async () => {
      // Mock run not found
      const { createClient } = await import('@/lib/supabase/server');
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn(() => ({
            data: { user: { id: 'test-user-123' } },
            error: null,
          })),
        },
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: { message: 'Not found' },
              })),
            })),
          })),
        })),
      }));

      const request = new NextRequest('http://localhost:3000/api/reports/non-existent/export/json');
      const params = Promise.resolve({ runId: 'non-existent' });

      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Run not found');
    });

    it('should handle export errors gracefully', async () => {
      // Mock database error
      const { createClient } = await import('@/lib/supabase/server');
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn(() => {
            throw new Error('Database connection failed');
          }),
        },
      }));

      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to export JSON');
    });

    it('should properly format JSON with indentation', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/json');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const text = await response.text();

      // JSON should be formatted (have newlines and indentation)
      expect(text).toContain('\n');
      expect(text).toContain('  '); // 2-space indentation
    });
  });
});

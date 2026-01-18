/**
 * CSV Export API Tests
 *
 * Tests for GET /api/reports/[runId]/export/csv
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/reports/[runId]/export/csv/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-123' } },
        error: null,
      })),
    },
  })),
}));

// Mock fetch for report data
global.fetch = jest.fn((url: string) => {
  if (url.includes('/api/reports/')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          run: {
            niche_query: 'AI productivity tools',
            created_at: '2026-01-01T00:00:00Z',
          },
          scores: {
            opportunity: 85,
            saturation: 45,
            longevity: 70,
            dissatisfaction: 65,
            misalignment: 50,
            confidence: 0.85,
          },
          summary: {
            totalAds: 150,
            totalMentions: 250,
            totalGaps: 12,
            totalConcepts: 5,
            uniqueAdvertisers: 45,
          },
          marketSnapshot: {
            topAdvertisers: [
              { name: 'TestCo', adCount: 25 },
              { name: 'CompetitorX', adCount: 20 },
            ],
            topAngles: [
              { label: 'Save time with AI', frequency: 15 },
              { label: 'Boost productivity', frequency: 12 },
            ],
          },
          painMap: {
            topObjections: [
              { label: 'Too expensive', frequency: 30, intensity: 0.8 },
              { label: 'Hard to use', frequency: 25, intensity: 0.7 },
            ],
            topFeatures: [
              { label: 'Better integrations', frequency: 20 },
              { label: 'Offline mode', frequency: 15 },
            ],
          },
          gaps: [
            {
              type: 'product',
              title: 'Missing offline functionality',
              problem: 'Users need offline access',
              recommendation: 'Add offline mode',
              score: 82,
              confidence: 0.9,
            },
          ],
          concepts: [
            {
              name: 'AI Task Manager',
              oneLiner: 'Smart task management with AI',
              platform: 'web',
              businessModel: 'b2b',
              difficulty: 45,
              opportunityScore: 85,
            },
          ],
          economics: [
            {
              name: 'AI Task Manager',
              cpc: { low: 0.5, expected: 2.0, high: 5.0 },
              cac: { low: 10, expected: 50, high: 150 },
              tam: { low: 100000, expected: 1000000, high: 10000000 },
            },
          ],
          ugc: {
            hooks: [
              { text: 'Stop wasting time on...', type: 'problem' },
              { text: 'Here\'s how I...', type: 'story' },
            ],
          },
        }),
    } as Response);
  }
  return Promise.reject(new Error('Unknown URL'));
}) as jest.Mock;

describe('CSV Export API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports/[runId]/export/csv', () => {
    it('should return CSV content', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);

      const csvContent = await response.text();
      expect(csvContent).toContain('GapRadar Market Analysis Report');
      expect(csvContent).toContain('AI productivity tools');
    });

    it('should include scores section', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      expect(csvContent).toContain('SCORES');
      expect(csvContent).toContain('Opportunity Score,85');
      expect(csvContent).toContain('Market Saturation,45');
      expect(csvContent).toContain('Confidence,85%');
    });

    it('should include data summary section', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      expect(csvContent).toContain('DATA SUMMARY');
      expect(csvContent).toContain('Ads Analyzed,150');
      expect(csvContent).toContain('Reddit Mentions,250');
      expect(csvContent).toContain('Gap Opportunities,12');
    });

    it('should include top advertisers with market share', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      expect(csvContent).toContain('TOP ADVERTISERS');
      expect(csvContent).toContain('TestCo');
      expect(csvContent).toContain('CompetitorX');
      expect(csvContent).toMatch(/Market Share %/);
    });

    it('should include top marketing angles', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      expect(csvContent).toContain('TOP MARKETING ANGLES');
      expect(csvContent).toContain('Save time with AI');
      expect(csvContent).toContain('Boost productivity');
    });

    it('should include user objections', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      expect(csvContent).toContain('TOP USER OBJECTIONS');
      expect(csvContent).toContain('Too expensive');
      expect(csvContent).toContain('Hard to use');
    });

    it('should include feature requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      expect(csvContent).toContain('TOP FEATURE REQUESTS');
      expect(csvContent).toContain('Better integrations');
      expect(csvContent).toContain('Offline mode');
    });

    it('should include gap opportunities', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      expect(csvContent).toContain('GAP OPPORTUNITIES');
      expect(csvContent).toContain('Missing offline functionality');
      expect(csvContent).toContain('Add offline mode');
    });

    it('should include product concepts', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      expect(csvContent).toContain('PRODUCT CONCEPTS');
      expect(csvContent).toContain('AI Task Manager');
      expect(csvContent).toContain('Smart task management with AI');
    });

    it('should include economics estimates', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      expect(csvContent).toContain('ECONOMICS ESTIMATES');
      expect(csvContent).toContain('CPC Low,CPC Expected,CPC High');
      expect(csvContent).toContain('CAC Low,CAC Expected,CAC High');
    });

    it('should include UGC hooks', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      expect(csvContent).toContain('UGC HOOKS');
      expect(csvContent).toContain('Stop wasting time on...');
    });

    it('should properly escape CSV special characters', async () => {
      // Mock data with special characters
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              run: { niche_query: 'Test, with "quotes" and\nnewlines', created_at: '2026-01-01' },
              scores: { opportunity: 50, saturation: 50, longevity: 50, dissatisfaction: 50, misalignment: 50, confidence: 0.5 },
              summary: { totalAds: 1, totalMentions: 1, totalGaps: 1, totalConcepts: 1, uniqueAdvertisers: 1 },
              marketSnapshot: { topAdvertisers: [{ name: 'Company, Inc.', adCount: 1 }], topAngles: [] },
              painMap: { topObjections: [], topFeatures: [] },
              gaps: [],
            }),
        } as Response)
      );

      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      // Quotes should be escaped
      expect(csvContent).toContain('Company, Inc.');
    });

    it('should set correct content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      expect(response.headers.get('Content-Type')).toBe('text/csv');
    });

    it('should set content-disposition header with filename', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('gapradar-');
      expect(disposition).toContain('.csv');
      expect(disposition).toContain('ai-productivity-tools');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      (createClient as jest.Mock).mockImplementationOnce(() => ({
        auth: {
          getUser: jest.fn(() => ({
            data: { user: null },
            error: null,
          })),
        },
      }));

      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle report fetch errors', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        } as Response)
      );

      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch report data');
    });

    it('should handle generation errors gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject(new Error('Network error')));

      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to generate CSV');
    });

    it('should format CSV with proper line breaks', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });
      const csvContent = await response.text();

      // CSV should have newlines
      expect(csvContent.split('\n').length).toBeGreaterThan(10);
    });

    it('should handle empty optional sections gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              run: { niche_query: 'Test', created_at: '2026-01-01' },
              scores: { opportunity: 50, saturation: 50, longevity: 50, dissatisfaction: 50, misalignment: 50, confidence: 0.5 },
              summary: { totalAds: 0, totalMentions: 0, totalGaps: 0, totalConcepts: 0, uniqueAdvertisers: 0 },
              marketSnapshot: { topAdvertisers: [], topAngles: [] },
              painMap: { topObjections: [], topFeatures: [] },
              gaps: [],
              concepts: [],
              economics: [],
              ugc: { hooks: [] },
            }),
        } as Response)
      );

      const request = new NextRequest('http://localhost:3000/api/reports/test-run-123/export/csv');
      const params = Promise.resolve({ runId: 'test-run-123' });

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      const csvContent = await response.text();
      expect(csvContent).toContain('GapRadar Market Analysis Report');
    });
  });
});

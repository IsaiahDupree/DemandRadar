/**
 * Tests for PDF Export API Endpoint
 * Feature: API-001 - PDF Export Endpoint
 *
 * Acceptance Criteria:
 * 1. PDF generates
 * 2. All sections included
 * 3. Downloadable
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/reports/[runId]/pdf/route';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock report generator (PDF functions are in report-generator.tsx)
jest.mock('@/lib/report-generator', () => ({
  generateReportPDF: jest.fn(),
  getReportFilename: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { generateReportPDF, getReportFilename } from '@/lib/report-generator';

// Mock global fetch
global.fetch = jest.fn();

describe('GET /api/reports/[runId]/pdf', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
  };

  const mockReportData = {
    run: {
      id: 'run-123',
      niche_query: 'AI productivity tools',
      status: 'complete',
    },
    summary: {
      nicheName: 'AI productivity tools',
      opportunityScore: 75,
      confidence: 0.85,
      topGaps: [
        { title: 'Better pricing transparency', type: 'pricing', score: 82 },
        { title: 'Improved onboarding', type: 'product', score: 78 },
        { title: 'Mobile app needed', type: 'product', score: 71 },
      ],
      platformRecommendation: {
        platform: 'web' as const,
        reasoning: 'Strong web presence with mobile companion',
      },
    },
    paidMarket: {
      topAdvertisers: [],
      topAngles: [],
      longestRunning: [],
      offerPatterns: { pricing: [], trials: [], guarantees: [] },
    },
    reddit: {
      topObjections: [],
      topDesiredFeatures: [],
      pricingFriction: [],
      trustFriction: [],
      switchingTriggers: [],
    },
    platformGap: {
      ios: { saturationScore: 45, topApps: [] },
      android: { saturationScore: 38, topApps: [] },
      web: { saturationScore: 72, topCompetitors: [] },
      recommendation: { platform: 'web' as const, rationale: 'Test' },
    },
    gaps: [],
    economics: {
      cpc: { low: 0.5, expected: 2.0, high: 5.0 },
      cac: { low: 10, expected: 50, high: 150 },
      tam: { low: 100000, expected: 1000000, high: 10000000, assumptions: [] },
      budgetScenarios: {
        spend1k: { reach: 500, conversions: 20, cost: 1000 },
        spend10k: { reach: 5000, conversions: 200, cost: 10000 },
      },
    },
    buildability: {
      implementationDifficulty: 45,
      timeToMVP: 'M' as const,
      humanTouchLevel: 'medium' as const,
      autonomousSuitability: 'high' as const,
      riskFlags: [],
    },
    ugc: {
      topCreatives: [],
      trendSignals: { hashtags: [], sounds: [] },
      creativePatterns: { hooks: [], formats: [], proofTypes: [], ctaStyles: [] },
      recommendations: { hooks: [], scripts: [], shotList: [] },
    },
    actionPlan: {
      sevenDayWins: [],
      thirtyDayRoadmap: [],
      adTestConcepts: [],
      landingPageStructure: { hero: '', benefits: [], cta: '' },
      topKeywords: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/reports/run-123/pdf')
    );

    const response = await GET(request, { params: Promise.resolve({ runId: 'run-123' }) });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should generate PDF and return it with correct headers', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock fetch to return report data
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockReportData),
    });

    const mockPDFBlob = new Blob(['mock-pdf-content'], { type: 'application/pdf' });
    (generateReportPDF as jest.Mock).mockResolvedValue(mockPDFBlob);
    (getReportFilename as jest.Mock).mockReturnValue('AI-productivity-tools.pdf');

    const request = new NextRequest(
      new URL('http://localhost:3000/api/reports/run-123/pdf')
    );

    const response = await GET(request, { params: Promise.resolve({ runId: 'run-123' }) });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('.pdf');

    // Verify PDF was generated with report data
    expect(generateReportPDF).toHaveBeenCalledWith(mockReportData);
    expect(getReportFilename).toHaveBeenCalledWith(mockReportData.run.niche_query);
  });

  it('should include all required sections in PDF', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock fetch to return report data
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockReportData),
    });

    const mockPDFBlob = new Blob(['mock-pdf-content'], { type: 'application/pdf' });
    (generateReportPDF as jest.Mock).mockResolvedValue(mockPDFBlob);
    (getReportFilename as jest.Mock).mockReturnValue('AI-productivity-tools.pdf');

    const request = new NextRequest(
      new URL('http://localhost:3000/api/reports/run-123/pdf')
    );

    await GET(request, { params: Promise.resolve({ runId: 'run-123' }) });

    // Verify PDF generator received full report data
    const pdfGeneratorCall = (generateReportPDF as jest.Mock).mock.calls[0][0];
    expect(pdfGeneratorCall).toHaveProperty('summary');
    expect(pdfGeneratorCall).toHaveProperty('paidMarket');
    expect(pdfGeneratorCall).toHaveProperty('reddit');
    expect(pdfGeneratorCall).toHaveProperty('platformGap');
    expect(pdfGeneratorCall).toHaveProperty('gaps');
    expect(pdfGeneratorCall).toHaveProperty('economics');
    expect(pdfGeneratorCall).toHaveProperty('buildability');
    expect(pdfGeneratorCall).toHaveProperty('ugc');
    expect(pdfGeneratorCall).toHaveProperty('actionPlan');
  });

  it('should handle errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock fetch to fail
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const request = new NextRequest(
      new URL('http://localhost:3000/api/reports/run-123/pdf')
    );

    const response = await GET(request, { params: Promise.resolve({ runId: 'run-123' }) });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch report data');
  });

  it('should sanitize filename for download', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const reportWithSpecialChars = {
      ...mockReportData,
      run: {
        ...mockReportData.run,
        niche_query: 'AI/ML Tools & Services',
      },
    };

    // Mock fetch to return report data with special chars
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(reportWithSpecialChars),
    });

    const mockPDFBlob = new Blob(['mock-pdf-content'], { type: 'application/pdf' });
    (generateReportPDF as jest.Mock).mockResolvedValue(mockPDFBlob);
    (getReportFilename as jest.Mock).mockReturnValue('AI-ML-Tools-Services.pdf');

    const request = new NextRequest(
      new URL('http://localhost:3000/api/reports/run-123/pdf')
    );

    const response = await GET(request, { params: Promise.resolve({ runId: 'run-123' }) });

    const contentDisposition = response.headers.get('Content-Disposition');

    // Filename should have special chars removed/replaced
    expect(contentDisposition).toContain('AI-ML-Tools-Services.pdf');
    expect(getReportFilename).toHaveBeenCalledWith('AI/ML Tools & Services');
  });
});

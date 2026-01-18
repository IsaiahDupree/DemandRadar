/**
 * Tests for Slides Export API
 * GET /api/reports/[id]/slides
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock Next.js response
jest.mock('next/server', () => {
  const actualModule = jest.requireActual('next/server');
  return {
    NextRequest: actualModule.NextRequest,
    NextResponse: class MockNextResponse extends Response {
      constructor(body?: BodyInit | null, init?: ResponseInit) {
        super(body, init);
      }

      static json(data: any, init?: ResponseInit) {
        return new Response(JSON.stringify(data), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
          },
        });
      }
    },
  };
});

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/reports/generator', () => ({
  generateReport: jest.fn(),
}));

jest.mock('@/lib/reports/slide-generator', () => ({
  generateSlides: jest.fn(),
}));

// Must import after mocks
import { GET } from '@/app/api/reports/[id]/slides/route';
import { createClient } from '@/lib/supabase/server';
import { generateReport } from '@/lib/reports/generator';
import { generateSlides } from '@/lib/reports/slide-generator';

describe('GET /api/reports/[id]/slides', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockReportData = {
    summary: {
      nicheName: 'AI Writing Tools',
      opportunityScore: 82,
      confidence: 0.85,
      topGaps: [],
      platformRecommendation: { platform: 'web', reasoning: 'Test' },
    },
    run: {},
    paidMarket: {},
    reddit: {},
    platformGap: {},
    gaps: [],
    economics: {},
    buildability: {},
    ugc: {},
    actionPlan: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not authenticated') }),
      },
    });

    const request = new NextRequest('http://localhost:3000/api/reports/run-123/slides');
    const params = { id: 'run-123' };

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  it('should return 404 if report is not found', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    (generateReport as jest.Mock).mockRejectedValue(new Error('Run not found'));

    const request = new NextRequest('http://localhost:3000/api/reports/invalid-id/slides');
    const params = { id: 'invalid-id' };

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe('Report not found');
  });

  it('should return 403 if user is unauthorized', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    (generateReport as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/reports/run-123/slides');
    const params = { id: 'run-123' };

    const response = await GET(request, { params });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Unauthorized');
  });

  it('should generate and return PPTX file', async () => {
    const mockBuffer = Buffer.from('504b0304', 'hex'); // PPTX signature

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    (generateReport as jest.Mock).mockResolvedValue(mockReportData);
    (generateSlides as jest.Mock).mockResolvedValue(mockBuffer);

    const request = new NextRequest('http://localhost:3000/api/reports/run-123/slides');
    const params = { id: 'run-123' };

    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('.pptx');
  });

  it('should accept custom branding options via query params', async () => {
    const mockBuffer = Buffer.from('504b0304', 'hex');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    (generateReport as jest.Mock).mockResolvedValue(mockReportData);
    (generateSlides as jest.Mock).mockResolvedValue(mockBuffer);

    const request = new NextRequest('http://localhost:3000/api/reports/run-123/slides?brandColor=%2310b981&includeCharts=false');
    const params = { id: 'run-123' };

    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    expect(generateSlides).toHaveBeenCalledWith(
      mockReportData,
      expect.objectContaining({
        brandColor: '#10b981',
        includeCharts: false,
      })
    );
  });

  it('should sanitize filename from niche name', async () => {
    const mockBuffer = Buffer.from('504b0304', 'hex');
    const reportWithSpecialChars = {
      ...mockReportData,
      summary: {
        ...mockReportData.summary,
        nicheName: 'AI/ML Tools & Services!',
      },
    };

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    (generateReport as jest.Mock).mockResolvedValue(reportWithSpecialChars);
    (generateSlides as jest.Mock).mockResolvedValue(mockBuffer);

    const request = new NextRequest('http://localhost:3000/api/reports/run-123/slides');
    const params = { id: 'run-123' };

    const response = await GET(request, { params });

    expect(response.status).toBe(200);
    const disposition = response.headers.get('Content-Disposition');
    expect(disposition).toMatch(/ai_ml_tools___services__report\.pptx/i);
  });
});

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BuildQueuePage from '@/app/dashboard/build-queue/page';
import { BuildRecommendation } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();

const mockRecommendation: BuildRecommendation = {
  id: '123',
  runId: 'run-123',
  nicheId: 'niche-123',
  userId: 'user-123',
  productIdea: 'Chrome Extension for Competitor Tracking',
  productType: 'chrome_extension',
  oneLiner: 'Track competitor changes automatically',
  targetAudience: 'Solo founders and small marketing teams',
  painPoints: [
    { text: 'Manual competitor tracking is time-consuming', source: 'reddit' }
  ],
  competitorGaps: [
    { competitor: 'CompetitorX', gap: 'No real-time alerts' }
  ],
  searchQueries: [
    { query: 'competitor tracking tool', volume: 1200 }
  ],
  recommendedHooks: ['Stop stalking competitors manually'],
  recommendedChannels: ['Google Ads', 'Twitter/X'],
  sampleAdCopy: {
    headline: 'Never miss a competitor move',
    body: 'Get instant alerts when competitors change pricing',
    cta: 'Install Free Extension'
  },
  landingPageAngle: 'Competitor tracking made easy',
  buildComplexity: 'weekend',
  techStackSuggestion: ['React', 'Chrome APIs', 'Supabase'],
  estimatedTimeToMvp: '2-3 days',
  estimatedCacRange: '$5-15',
  confidenceScore: 87,
  reasoning: 'Strong demand signals from Reddit',
  supportingSignals: 12,
  status: 'new',
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
};

describe('BuildQueuePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page title', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: [], total: 0 }),
    });

    render(<BuildQueuePage />);

    expect(screen.getByText('Build Queue')).toBeDefined();
  });

  it('should display loading state initially', async () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<BuildQueuePage />);

    expect(screen.getByText(/Loading recommendations/i)).toBeDefined();
  });

  it('should fetch and display recommendations', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recommendations: [mockRecommendation],
        total: 1,
      }),
    });

    render(<BuildQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('Chrome Extension for Competitor Tracking')).toBeDefined();
      expect(screen.getByText('Track competitor changes automatically')).toBeDefined();
    });
  });

  it('should display confidence score', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recommendations: [mockRecommendation],
        total: 1,
      }),
    });

    render(<BuildQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('87')).toBeDefined();
      expect(screen.getByText('match')).toBeDefined();
    });
  });

  it('should display build complexity badge', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recommendations: [mockRecommendation],
        total: 1,
      }),
    });

    render(<BuildQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('weekend')).toBeDefined();
    });
  });

  it('should display action buttons', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recommendations: [mockRecommendation],
        total: 1,
      }),
    });

    render(<BuildQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('View Details')).toBeDefined();
      expect(screen.getByText('Save')).toBeDefined();
      expect(screen.getByText('Dismiss')).toBeDefined();
    });
  });

  it('should handle status change when Save is clicked', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          recommendations: [mockRecommendation],
          total: 1,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<BuildQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('Save')).toBeDefined();
    });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/recommendations/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'saved' }),
        })
      );
    });
  });

  it('should display empty state when no recommendations', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: [], total: 0 }),
    });

    render(<BuildQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('No recommendations yet')).toBeDefined();
    });
  });

  it('should display error message on fetch failure', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<BuildQueuePage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load recommendations/i)).toBeDefined();
    });
  });

  it('should have Generate button', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recommendations: [], total: 0 }),
    });

    render(<BuildQueuePage />);

    await waitFor(() => {
      expect(screen.getByText('Generate')).toBeDefined();
    });
  });
});

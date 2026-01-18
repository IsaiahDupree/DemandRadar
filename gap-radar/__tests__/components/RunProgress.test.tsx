/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RunProgress } from '@/components/RunProgress';
import { useRunStatus } from '@/hooks/use-run-status';

// Mock the useRunStatus hook
jest.mock('@/hooks/use-run-status');

const mockUseRunStatus = useRunStatus as jest.MockedFunction<typeof useRunStatus>;

describe('RunProgress Component (UI-001)', () => {
  const mockRunId = 'test-run-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should render skeleton when loading', () => {
      mockUseRunStatus.mockReturnValue({
        run: null,
        loading: true,
        error: null,
        progressPercentage: 0,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: false,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      // Should show skeleton elements
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render compact skeleton when compact mode is enabled', () => {
      mockUseRunStatus.mockReturnValue({
        run: null,
        loading: true,
        error: null,
        progressPercentage: 0,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: false,
        isQueued: false,
      });

      const { container } = render(<RunProgress runId={mockRunId} compact={true} />);

      // Compact skeleton should be simpler
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error state', () => {
    it('should display error message when error occurs', () => {
      const errorMessage = 'Failed to fetch run status';
      mockUseRunStatus.mockReturnValue({
        run: null,
        loading: false,
        error: errorMessage,
        progressPercentage: 0,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: false,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show error alert with destructive styling', () => {
      mockUseRunStatus.mockReturnValue({
        run: null,
        loading: false,
        error: 'Network error',
        progressPercentage: 0,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: false,
        isQueued: false,
      });

      const { container } = render(<RunProgress runId={mockRunId} />);

      // Should have destructive variant alert
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Queued status', () => {
    it('should display queued status with waiting message', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'queued',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: null,
          finished_at: null,
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 0,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: false,
        isQueued: true,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText(/Waiting to start/i)).toBeInTheDocument();
      expect(screen.getByText('QUEUED')).toBeInTheDocument();
    });

    it('should show 0% progress when queued', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'queued',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: null,
          finished_at: null,
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 0,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: false,
        isQueued: true,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Running status', () => {
    it('should display running status with progress indicator', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
          current_step: 'Collecting ad data',
          progress_percentage: 45,
        },
        loading: false,
        error: null,
        progressPercentage: 45,
        estimatedTimeRemaining: '3 minutes',
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText('RUNNING')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('Collecting ad data')).toBeInTheDocument();
    });

    it('should show estimated time remaining when running', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
          progress_percentage: 60,
        },
        loading: false,
        error: null,
        progressPercentage: 60,
        estimatedTimeRemaining: '2 minutes',
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText(/Estimated time remaining: 2 minutes/i)).toBeInTheDocument();
    });

    it('should show current step when provided', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
          current_step: 'Analyzing Reddit sentiment',
        },
        loading: false,
        error: null,
        progressPercentage: 75,
        estimatedTimeRemaining: '1 minute',
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText('Analyzing Reddit sentiment')).toBeInTheDocument();
    });

    it('should show animated spinner icon when running', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 50,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      const { container } = render(<RunProgress runId={mockRunId} />);

      // Should have spinning animation
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Complete status', () => {
    it('should display complete status with success message', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'complete',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: '2026-01-17T10:15:00Z',
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 100,
        estimatedTimeRemaining: null,
        isComplete: true,
        isFailed: false,
        isRunning: false,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText('COMPLETE')).toBeInTheDocument();
      expect(screen.getByText(/Analysis complete! Your report is ready./i)).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should show duration when complete', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'complete',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: '2026-01-17T10:15:00Z',
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 100,
        estimatedTimeRemaining: null,
        isComplete: true,
        isFailed: false,
        isRunning: false,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText('Duration')).toBeInTheDocument();
    });

    it('should call onComplete callback when complete', () => {
      const onComplete = jest.fn();

      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'complete',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: '2026-01-17T10:15:00Z',
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 100,
        estimatedTimeRemaining: null,
        isComplete: true,
        isFailed: false,
        isRunning: false,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} onComplete={onComplete} />);

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('Failed status', () => {
    it('should display failed status with error message', () => {
      const errorMessage = 'Rate limit exceeded';
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'failed',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: '2026-01-17T10:08:00Z',
          error: errorMessage,
        },
        loading: false,
        error: null,
        progressPercentage: 0,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: true,
        isRunning: false,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText('FAILED')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show destructive badge for failed status', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'failed',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: '2026-01-17T10:08:00Z',
          error: 'Test error',
        },
        loading: false,
        error: null,
        progressPercentage: 0,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: true,
        isRunning: false,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      const badge = screen.getByText('FAILED');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Real-time updates', () => {
    it('should enable real-time updates by default', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 50,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(mockUseRunStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: mockRunId,
          enableRealtime: true,
        })
      );
    });

    it('should allow disabling real-time updates', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 50,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} enableRealtime={false} />);

      expect(mockUseRunStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: mockRunId,
          enableRealtime: false,
        })
      );
    });
  });

  describe('Compact mode', () => {
    it('should render in compact mode when enabled', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 50,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      const { container } = render(<RunProgress runId={mockRunId} compact={true} />);

      // Compact mode should not show the card container
      const card = container.querySelector('[role="article"]');
      expect(card).not.toBeInTheDocument();

      // Should still show progress
      expect(screen.getByText('running')).toBeInTheDocument();
    });

    it('should hide details in compact mode', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 50,
        estimatedTimeRemaining: '2 minutes',
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} compact={true} />);

      // Should not show time estimate in compact mode
      expect(screen.queryByText(/Estimated time remaining/i)).not.toBeInTheDocument();
    });
  });

  describe('Details visibility', () => {
    it('should show details by default', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 50,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText('Started')).toBeInTheDocument();
    });

    it('should hide details when showDetails is false', () => {
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: 'AI productivity tools',
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 50,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} showDetails={false} />);

      expect(screen.queryByText('Started')).not.toBeInTheDocument();
    });
  });

  describe('Niche query display', () => {
    it('should display niche query in full mode', () => {
      const nicheQuery = 'AI productivity tools for remote teams';
      mockUseRunStatus.mockReturnValue({
        run: {
          id: mockRunId,
          status: 'running',
          niche_query: nicheQuery,
          created_at: '2026-01-17T10:00:00Z',
          started_at: '2026-01-17T10:05:00Z',
          finished_at: null,
          error: null,
        },
        loading: false,
        error: null,
        progressPercentage: 50,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: true,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText(nicheQuery)).toBeInTheDocument();
    });
  });

  describe('Run not found', () => {
    it('should show message when run is not found', () => {
      mockUseRunStatus.mockReturnValue({
        run: null,
        loading: false,
        error: null,
        progressPercentage: 0,
        estimatedTimeRemaining: null,
        isComplete: false,
        isFailed: false,
        isRunning: false,
        isQueued: false,
      });

      render(<RunProgress runId={mockRunId} />);

      expect(screen.getByText('Run not found')).toBeInTheDocument();
    });
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { useRunProgress } from '@/hooks/use-run-progress';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('useRunProgress', () => {
  let mockSupabase: any;
  let mockChannel: any;
  let subscribeCallback: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    subscribeCallback = null;

    // Create mock channel
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        if (callback) {
          callback('SUBSCRIBED');
        }
        return mockChannel;
      }),
      unsubscribe: jest.fn(),
    };

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      channel: jest.fn(() => mockChannel),
      removeChannel: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should subscribe to run changes on mount', async () => {
    const runId = 'test-run-id';

    mockSupabase.single.mockResolvedValue({
      data: {
        id: runId,
        status: 'queued',
        niche_query: 'Test query',
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
        error: null,
      },
      error: null,
    });

    const { result } = renderHook(() => useRunProgress({ runId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify channel creation
    expect(mockSupabase.channel).toHaveBeenCalledWith(`run-${runId}`);

    // Verify subscription to postgres changes
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'UPDATE',
        schema: 'public',
        table: 'runs',
        filter: `id=eq.${runId}`,
      }),
      expect.any(Function)
    );

    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('should update run data in real-time', async () => {
    const runId = 'test-run-id';
    let updateHandler: any;

    mockSupabase.single.mockResolvedValue({
      data: {
        id: runId,
        status: 'queued',
        niche_query: 'Test query',
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
        error: null,
      },
      error: null,
    });

    mockChannel.on.mockImplementation((event, config, handler) => {
      if (event === 'postgres_changes') {
        updateHandler = handler;
      }
      return mockChannel;
    });

    const { result } = renderHook(() => useRunProgress({ runId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.run?.status).toBe('queued');

    // Simulate real-time update
    const updatedRun = {
      id: runId,
      status: 'running',
      niche_query: 'Test query',
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      finished_at: null,
      error: null,
      progress_percentage: 25,
      current_step: 'Collecting ads',
    };

    updateHandler({ new: updatedRun });

    await waitFor(() => {
      expect(result.current.run?.status).toBe('running');
      expect(result.current.progressPercentage).toBe(25);
      expect(result.current.currentStep).toBe('Collecting ads');
    });
  });

  it('should cleanup subscription on unmount', async () => {
    const runId = 'test-run-id';

    mockSupabase.single.mockResolvedValue({
      data: {
        id: runId,
        status: 'queued',
        niche_query: 'Test query',
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
        error: null,
      },
      error: null,
    });

    const { unmount } = renderHook(() => useRunProgress({ runId }));

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
    });

    unmount();

    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('should fallback to polling if realtime is disabled', async () => {
    jest.useFakeTimers();
    const runId = 'test-run-id';

    mockSupabase.single.mockResolvedValue({
      data: {
        id: runId,
        status: 'running',
        niche_query: 'Test query',
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        finished_at: null,
        error: null,
      },
      error: null,
    });

    const { result, unmount } = renderHook(() =>
      useRunProgress({ runId, enableRealtime: false, pollingInterval: 1000 })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify no channel subscription
    expect(mockSupabase.channel).not.toHaveBeenCalled();

    // Advance timer to trigger polling
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('runs');
    });

    unmount();
    jest.useRealTimers();
  });

  it('should handle errors gracefully', async () => {
    const runId = 'test-run-id';
    const errorMessage = 'Database connection failed';

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: new Error(errorMessage),
    });

    const { result } = renderHook(() => useRunProgress({ runId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.run).toBeNull();
  });

  it('should calculate progress percentage correctly', async () => {
    const runId = 'test-run-id';
    let updateHandler: any;

    // Test queued status
    mockSupabase.single.mockResolvedValue({
      data: {
        id: runId,
        status: 'queued',
        niche_query: 'Test query',
        created_at: new Date().toISOString(),
        started_at: null,
        finished_at: null,
        error: null,
      },
      error: null,
    });

    mockChannel.on.mockImplementation((event, config, handler) => {
      if (event === 'postgres_changes') {
        updateHandler = handler;
      }
      return mockChannel;
    });

    const { result } = renderHook(() => useRunProgress({ runId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.progressPercentage).toBe(0);

    // Simulate real-time update with explicit progress
    const updatedRun = {
      id: runId,
      status: 'running',
      niche_query: 'Test query',
      created_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      finished_at: null,
      error: null,
      progress_percentage: 75,
    };

    updateHandler({ new: updatedRun });

    await waitFor(() => {
      expect(result.current.progressPercentage).toBe(75);
    });
  });

  it('should provide helper flags for run states', async () => {
    const runId = 'test-run-id';

    mockSupabase.single.mockResolvedValue({
      data: {
        id: runId,
        status: 'complete',
        niche_query: 'Test query',
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        error: null,
      },
      error: null,
    });

    const { result } = renderHook(() => useRunProgress({ runId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isQueued).toBe(false);
    expect(result.current.isFailed).toBe(false);
  });

  it('should stop polling when run completes', async () => {
    jest.useFakeTimers();
    const runId = 'test-run-id';

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: runId,
        status: 'running',
        niche_query: 'Test query',
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        finished_at: null,
        error: null,
      },
      error: null,
    });

    renderHook(() =>
      useRunProgress({ runId, enableRealtime: false, pollingInterval: 1000 })
    );

    await waitFor(() => {
      expect(mockSupabase.single).toHaveBeenCalledTimes(1);
    });

    // Mock completed run on next poll
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: runId,
        status: 'complete',
        niche_query: 'Test query',
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        error: null,
      },
      error: null,
    });

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockSupabase.single).toHaveBeenCalledTimes(2);
    });

    // Advance more - should not poll again
    jest.advanceTimersByTime(5000);

    expect(mockSupabase.single).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });
});

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RunProgress {
  id: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  niche_query: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  current_step?: string;
  progress_percentage?: number;
}

interface UseRunProgressOptions {
  runId: string;
  enableRealtime?: boolean;
  pollingInterval?: number; // fallback polling interval in ms
}

export function useRunProgress({
  runId,
  enableRealtime = true,
  pollingInterval = 3000,
}: UseRunProgressOptions) {
  const [run, setRun] = useState<RunProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    // Initial fetch
    async function fetchRun() {
      try {
        const { data, error: fetchError } = await supabase
          .from('runs')
          .select('*')
          .eq('id', runId)
          .single();

        if (fetchError) throw fetchError;

        setRun(data as RunProgress);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch run');
        setLoading(false);
      }
    }

    fetchRun();

    // Set up realtime subscription if enabled
    if (enableRealtime) {
      channel = supabase
        .channel(`run-${runId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'runs',
            filter: `id=eq.${runId}`,
          },
          (payload) => {
            setRun(payload.new as RunProgress);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Realtime subscription active for run ${runId}`);
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('Realtime subscription failed, falling back to polling');
            startPolling();
          }
        });
    } else {
      // Use polling if realtime is disabled
      startPolling();
    }

    function startPolling() {
      if (pollInterval) return; // Already polling

      pollInterval = setInterval(async () => {
        const { data } = await supabase
          .from('runs')
          .select('*')
          .eq('id', runId)
          .single();

        if (data) {
          setRun(data as RunProgress);

          // Stop polling if run is complete or failed
          if (data.status === 'complete' || data.status === 'failed') {
            if (pollInterval) clearInterval(pollInterval);
          }
        }
      }, pollingInterval);
    }

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [runId, enableRealtime, pollingInterval]);

  // Calculate progress percentage based on status or explicit value
  const progressPercentage = run
    ? run.progress_percentage ?? getProgressFromStatus(run.status)
    : 0;

  // Get current step description
  const currentStep = run?.current_step || getStepFromStatus(run?.status || 'queued');

  // Estimate time remaining
  const estimatedTimeRemaining =
    run && run.started_at && run.status === 'running'
      ? estimateTimeRemaining(run.started_at, progressPercentage)
      : null;

  return {
    run,
    loading,
    error,
    progressPercentage,
    currentStep,
    estimatedTimeRemaining,
    isComplete: run?.status === 'complete',
    isFailed: run?.status === 'failed',
    isRunning: run?.status === 'running',
    isQueued: run?.status === 'queued',
  };
}

function getProgressFromStatus(status: string): number {
  switch (status) {
    case 'queued':
      return 0;
    case 'running':
      return 50; // Generic halfway point
    case 'complete':
      return 100;
    case 'failed':
      return 0;
    default:
      return 0;
  }
}

function getStepFromStatus(status: string): string {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'running':
      return 'Running';
    case 'complete':
      return 'Complete';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

function estimateTimeRemaining(startedAt: string, progressPercentage: number): string {
  if (progressPercentage === 0 || progressPercentage >= 100) return 'N/A';

  const elapsed = Date.now() - new Date(startedAt).getTime();
  const total = (elapsed / progressPercentage) * 100;
  const remaining = total - elapsed;

  const minutes = Math.ceil(remaining / (1000 * 60));

  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Run } from '@/types';

export function useRuns() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/runs');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch runs');
      }

      setRuns(data.runs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch runs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const createRun = async (params: {
    nicheQuery: string;
    seedTerms?: string[];
    competitors?: string[];
    geo?: string;
    runType?: 'light' | 'deep';
  }) => {
    try {
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create run');
      }

      // Refresh runs list
      await fetchRuns();
      
      return data.run;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create run');
    }
  };

  const deleteRun = async (runId: string) => {
    try {
      const response = await fetch(`/api/runs/${runId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete run');
      }

      // Refresh runs list
      await fetchRuns();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete run');
    }
  };

  return {
    runs,
    loading,
    error,
    refresh: fetchRuns,
    createRun,
    deleteRun,
  };
}

export function useRun(runId: string) {
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRun = useCallback(async () => {
    if (!runId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/runs/${runId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch run');
      }

      setRun(data.run);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch run');
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchRun();
  }, [fetchRun]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!runId) return;

    const supabase = createClient();
    
    const channel = supabase
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
          setRun(prev => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [runId]);

  return {
    run,
    loading,
    error,
    refresh: fetchRun,
  };
}

export function useUser() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
    plan: string;
    runsUsed: number;
    runsLimit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            plan: userData.plan,
            runsUsed: userData.runs_used,
            runsLimit: userData.runs_limit,
          });
        }
      }
      
      setLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

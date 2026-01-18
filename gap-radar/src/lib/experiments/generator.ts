/**
 * Experiment Generator
 *
 * Generates weekly experiment suggestions based on demand signals
 * and tracks experiment results over time
 */

import { createClient } from '@supabase/supabase-js';
import { generateExperimentSuggestions, type DemandSnapshot } from './suggestions';

// Types
export type ExperimentType = 'copy' | 'angle' | 'offer' | 'pricing' | 'feature' | 'targeting';

export interface Experiment {
  id: string;
  niche_id: string;
  week: string; // ISO week format: YYYY-Www
  type: ExperimentType;
  title: string;
  hypothesis: string;
  setup_instructions: string;
  success_metrics: string[];
  estimated_effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  evidence: string;
  created_at: string;
}

export interface ExperimentResult {
  id: string;
  experiment_id: string;
  outcome: 'success' | 'failed' | 'inconclusive' | 'in_progress';
  metrics_achieved: Record<string, any>;
  learnings: string;
  confidence: number; // 0-1
  created_at: string;
}

export interface ExperimentWithResult extends Experiment {
  result?: ExperimentResult;
}

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get ISO week string from date
 */
function getISOWeek(date: Date = new Date()): string {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = target.getFullYear();
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Generate a weekly experiment suggestion for a niche
 */
export async function generateWeeklyExperiment(
  nicheId: string,
  snapshot: Partial<DemandSnapshot>
): Promise<Experiment> {
  const supabase = getSupabaseClient();
  const week = getISOWeek();

  // Check if experiment already exists for this week
  const { data: existing } = await supabase
    .from('niche_experiments')
    .select('*')
    .eq('niche_id', nicheId)
    .eq('week', week)
    .single();

  if (existing) {
    return existing as Experiment;
  }

  // Generate experiment suggestions using the AI service
  const suggestions = await generateExperimentSuggestions('Niche', snapshot as DemandSnapshot);

  if (suggestions.length === 0) {
    throw new Error('Failed to generate experiment suggestions');
  }

  // Take the top-priority suggestion
  const topSuggestion = suggestions[0];

  // Store in database
  const { data, error } = await supabase
    .from('niche_experiments')
    .insert({
      niche_id: nicheId,
      week,
      type: topSuggestion.type,
      title: topSuggestion.title,
      hypothesis: topSuggestion.hypothesis,
      setup_instructions: topSuggestion.setup,
      success_metrics: topSuggestion.success_metrics,
      estimated_effort: topSuggestion.estimated_effort,
      priority: topSuggestion.priority,
      evidence: topSuggestion.evidence,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store experiment: ${error.message}`);
  }

  return data as Experiment;
}

/**
 * Track an experiment result
 */
export async function trackExperimentResult(
  result: Omit<ExperimentResult, 'id' | 'created_at'>
): Promise<ExperimentResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('experiment_results')
    .upsert(
      {
        experiment_id: result.experiment_id,
        outcome: result.outcome,
        metrics_achieved: result.metrics_achieved,
        learnings: result.learnings,
        confidence: result.confidence,
      },
      {
        onConflict: 'experiment_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to track experiment result: ${error.message}`);
  }

  return data as ExperimentResult;
}

/**
 * Get experiment history for a niche
 */
export async function getExperimentHistory(
  nicheId: string,
  limit: number = 10
): Promise<ExperimentWithResult[]> {
  const supabase = getSupabaseClient();

  const { data: experiments, error } = await supabase
    .from('niche_experiments')
    .select(
      `
      *,
      result:experiment_results(*)
    `
    )
    .eq('niche_id', nicheId)
    .order('week', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching experiment history:', error);
    return [];
  }

  return (experiments || []).map((exp) => ({
    id: exp.id,
    niche_id: exp.niche_id,
    week: exp.week,
    type: exp.type,
    title: exp.title,
    hypothesis: exp.hypothesis,
    setup_instructions: exp.setup_instructions,
    success_metrics: exp.success_metrics,
    estimated_effort: exp.estimated_effort,
    priority: exp.priority,
    evidence: exp.evidence,
    created_at: exp.created_at,
    result: Array.isArray(exp.result) && exp.result.length > 0 ? exp.result[0] : undefined,
  }));
}

/**
 * Get the current week's experiment for a niche
 */
export async function getCurrentWeekExperiment(
  nicheId: string
): Promise<ExperimentWithResult | null> {
  const supabase = getSupabaseClient();
  const week = getISOWeek();

  const { data, error } = await supabase
    .from('niche_experiments')
    .select(
      `
      *,
      result:experiment_results(*)
    `
    )
    .eq('niche_id', nicheId)
    .eq('week', week)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    niche_id: data.niche_id,
    week: data.week,
    type: data.type,
    title: data.title,
    hypothesis: data.hypothesis,
    setup_instructions: data.setup_instructions,
    success_metrics: data.success_metrics,
    estimated_effort: data.estimated_effort,
    priority: data.priority,
    evidence: data.evidence,
    created_at: data.created_at,
    result: Array.isArray(data.result) && data.result.length > 0 ? data.result[0] : undefined,
  };
}

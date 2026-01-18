/**
 * Experiment Loop Feature
 *
 * BRIEF-016: Weekly experiment suggestions and results tracking
 *
 * This module provides:
 * 1. Experiment suggestions based on demand signals
 * 2. Results tracking and analytics
 * 3. Email integration for weekly experiment updates
 */

// Re-export all types and functions
export type {
  ExperimentType,
  Experiment,
  ExperimentResult,
  ExperimentWithResult,
} from './experiments/generator';

export type {
  ExperimentSuggestion,
  DemandSnapshot,
} from './experiments/suggestions';

export {
  generateWeeklyExperiment,
  trackExperimentResult,
  getExperimentHistory,
  getCurrentWeekExperiment,
} from './experiments/generator';

export {
  generateExperimentSuggestions,
} from './experiments/suggestions';

export interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

export interface OnboardingState {
  steps: OnboardingStep[];
  dismissed: boolean;
  completedAt?: string;
}

const ONBOARDING_STORAGE_KEY = 'gapradar_onboarding';

export const defaultOnboardingSteps: OnboardingStep[] = [
  {
    id: 'complete_profile',
    title: 'Complete your profile',
    description: 'Add your name and preferences',
    completed: false,
  },
  {
    id: 'create_first_run',
    title: 'Create your first run',
    description: 'Analyze your first market niche',
    completed: false,
  },
  {
    id: 'review_report',
    title: 'Review your first report',
    description: 'Explore the gap opportunities',
    completed: false,
  },
  {
    id: 'save_gap',
    title: 'Save a gap opportunity',
    description: 'Bookmark an interesting gap',
    completed: false,
  },
];

export function getOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') {
    return {
      steps: defaultOnboardingSteps,
      dismissed: false,
    };
  }

  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) {
      return {
        steps: defaultOnboardingSteps,
        dismissed: false,
      };
    }

    const parsed = JSON.parse(stored);
    return {
      steps: parsed.steps || defaultOnboardingSteps,
      dismissed: parsed.dismissed || false,
      completedAt: parsed.completedAt,
    };
  } catch (error) {
    console.error('Error loading onboarding state:', error);
    return {
      steps: defaultOnboardingSteps,
      dismissed: false,
    };
  }
}

export function saveOnboardingState(state: OnboardingState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving onboarding state:', error);
  }
}

export function completeOnboardingStep(stepId: string): OnboardingState {
  const state = getOnboardingState();
  const steps = state.steps.map(step =>
    step.id === stepId ? { ...step, completed: true } : step
  );

  const allCompleted = steps.every(step => step.completed);
  const newState: OnboardingState = {
    steps,
    dismissed: state.dismissed,
    completedAt: allCompleted ? new Date().toISOString() : state.completedAt,
  };

  saveOnboardingState(newState);
  return newState;
}

export function dismissOnboarding(): OnboardingState {
  const state = getOnboardingState();
  const newState: OnboardingState = {
    ...state,
    dismissed: true,
  };

  saveOnboardingState(newState);
  return newState;
}

export function resetOnboarding(): OnboardingState {
  const newState: OnboardingState = {
    steps: defaultOnboardingSteps,
    dismissed: false,
  };

  saveOnboardingState(newState);
  return newState;
}

export function getOnboardingProgress(steps: OnboardingStep[]): number {
  if (steps.length === 0) return 0;
  const completed = steps.filter(step => step.completed).length;
  return Math.round((completed / steps.length) * 100);
}

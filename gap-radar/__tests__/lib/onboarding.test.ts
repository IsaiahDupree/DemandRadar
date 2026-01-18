import {
  OnboardingStep,
  OnboardingState,
  defaultOnboardingSteps,
  getOnboardingState,
  saveOnboardingState,
  completeOnboardingStep,
  dismissOnboarding,
  resetOnboarding,
  getOnboardingProgress,
} from '@/lib/onboarding';

describe('Onboarding Library', () => {
  // Mock localStorage
  let localStorageMock: { [key: string]: string } = {};

  beforeAll(() => {
    global.Storage.prototype.getItem = jest.fn((key: string) => localStorageMock[key] || null);
    global.Storage.prototype.setItem = jest.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    global.Storage.prototype.removeItem = jest.fn((key: string) => {
      delete localStorageMock[key];
    });
    global.Storage.prototype.clear = jest.fn(() => {
      localStorageMock = {};
    });
  });

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock = {};
  });

  describe('getOnboardingState', () => {
    it('returns default state when no stored data exists', () => {
      const state = getOnboardingState();

      expect(state.steps).toEqual(defaultOnboardingSteps);
      expect(state.dismissed).toBe(false);
      expect(state.completedAt).toBeUndefined();
    });

    it('returns stored state when available', () => {
      const storedState: OnboardingState = {
        steps: [
          { id: 'step1', title: 'Test Step', completed: true },
        ],
        dismissed: false,
      };

      localStorageMock['gapradar_onboarding'] = JSON.stringify(storedState);

      const state = getOnboardingState();
      expect(state.steps).toEqual(storedState.steps);
      expect(state.dismissed).toBe(false);
    });

    it('handles corrupted localStorage data gracefully', () => {
      localStorageMock['gapradar_onboarding'] = 'invalid json{';

      const state = getOnboardingState();
      expect(state.steps).toEqual(defaultOnboardingSteps);
      expect(state.dismissed).toBe(false);
    });
  });

  describe('saveOnboardingState', () => {
    it('saves state to localStorage', () => {
      const state: OnboardingState = {
        steps: defaultOnboardingSteps,
        dismissed: true,
      };

      saveOnboardingState(state);

      const stored = localStorageMock['gapradar_onboarding'];
      expect(stored).toBeDefined();
      expect(JSON.parse(stored)).toEqual(state);
    });
  });

  describe('completeOnboardingStep', () => {
    it('marks a step as completed', () => {
      const state = completeOnboardingStep('complete_profile');

      const completedStep = state.steps.find(s => s.id === 'complete_profile');
      expect(completedStep?.completed).toBe(true);
    });

    it('does not modify other steps', () => {
      const state = completeOnboardingStep('complete_profile');

      const otherSteps = state.steps.filter(s => s.id !== 'complete_profile');
      otherSteps.forEach(step => {
        expect(step.completed).toBe(false);
      });
    });

    it('sets completedAt when all steps are complete', () => {
      // Complete all steps one by one
      let state = completeOnboardingStep('complete_profile');
      state = completeOnboardingStep('create_first_run');
      state = completeOnboardingStep('review_report');
      state = completeOnboardingStep('save_gap');

      expect(state.completedAt).toBeDefined();
      const completedDate = new Date(state.completedAt!);
      expect(completedDate.getTime()).toBeGreaterThan(0);
    });

    it('persists the completed state', () => {
      completeOnboardingStep('complete_profile');

      const stored = localStorageMock['gapradar_onboarding'];
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored);
      const completedStep = parsed.steps.find((s: OnboardingStep) => s.id === 'complete_profile');
      expect(completedStep?.completed).toBe(true);
    });
  });

  describe('dismissOnboarding', () => {
    it('sets dismissed to true', () => {
      const state = dismissOnboarding();

      expect(state.dismissed).toBe(true);
    });

    it('persists the dismissed state', () => {
      dismissOnboarding();

      const stored = localStorageMock['gapradar_onboarding'];
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored);
      expect(parsed.dismissed).toBe(true);
    });
  });

  describe('resetOnboarding', () => {
    it('resets to default state', () => {
      // First, make some changes
      completeOnboardingStep('complete_profile');
      dismissOnboarding();

      // Then reset
      const state = resetOnboarding();

      expect(state.steps).toEqual(defaultOnboardingSteps);
      expect(state.dismissed).toBe(false);
      expect(state.completedAt).toBeUndefined();
    });

    it('persists the reset state', () => {
      resetOnboarding();

      const stored = localStorageMock['gapradar_onboarding'];
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored);
      expect(parsed.steps).toEqual(defaultOnboardingSteps);
      expect(parsed.dismissed).toBe(false);
    });
  });

  describe('getOnboardingProgress', () => {
    it('returns 0 for empty steps array', () => {
      const progress = getOnboardingProgress([]);
      expect(progress).toBe(0);
    });

    it('returns 0 when no steps are completed', () => {
      const steps: OnboardingStep[] = [
        { id: 'step1', title: 'Step 1', completed: false },
        { id: 'step2', title: 'Step 2', completed: false },
      ];

      const progress = getOnboardingProgress(steps);
      expect(progress).toBe(0);
    });

    it('returns 100 when all steps are completed', () => {
      const steps: OnboardingStep[] = [
        { id: 'step1', title: 'Step 1', completed: true },
        { id: 'step2', title: 'Step 2', completed: true },
      ];

      const progress = getOnboardingProgress(steps);
      expect(progress).toBe(100);
    });

    it('calculates correct percentage for partial completion', () => {
      const steps: OnboardingStep[] = [
        { id: 'step1', title: 'Step 1', completed: true },
        { id: 'step2', title: 'Step 2', completed: false },
        { id: 'step3', title: 'Step 3', completed: false },
        { id: 'step4', title: 'Step 4', completed: false },
      ];

      const progress = getOnboardingProgress(steps);
      expect(progress).toBe(25); // 1/4 = 25%
    });

    it('rounds progress to nearest integer', () => {
      const steps: OnboardingStep[] = [
        { id: 'step1', title: 'Step 1', completed: true },
        { id: 'step2', title: 'Step 2', completed: true },
        { id: 'step3', title: 'Step 3', completed: false },
      ];

      const progress = getOnboardingProgress(steps);
      expect(progress).toBe(67); // 2/3 = 66.67% rounded to 67%
    });
  });
});

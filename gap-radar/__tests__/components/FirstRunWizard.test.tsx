import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FirstRunWizard } from '@/components/onboarding/FirstRunWizard';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('First Run Wizard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the wizard with first step', () => {
    render(<FirstRunWizard />);

    expect(screen.getByText(/First Analysis Run/i)).toBeInTheDocument();
  });

  it('displays example queries', () => {
    render(<FirstRunWizard />);

    // Navigate to step 2 where examples are shown
    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    // Should show at least some example queries
    expect(screen.getByText('Examples:')).toBeInTheDocument();
    const exampleButtons = screen.getAllByTestId('example-query');
    expect(exampleButtons.length).toBeGreaterThan(0);
  });

  it('allows user to skip the wizard', () => {
    const mockOnComplete = jest.fn();
    const mockOnSkip = jest.fn();

    render(<FirstRunWizard onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    const skipButton = screen.getByText(/skip for now/i);
    fireEvent.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('navigates through multiple steps', () => {
    render(<FirstRunWizard />);

    // Should start at step 1
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();

    // Click next to go to step 2
    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    // Should now be at step 2
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
  });

  it('allows going back to previous step', () => {
    render(<FirstRunWizard />);

    // Go to step 2
    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    // Should be at step 2
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();

    // Go back to step 1
    const backButton = screen.getByText(/back/i);
    fireEvent.click(backButton);

    // Should be back at step 1
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
  });

  it('allows selecting an example query', () => {
    render(<FirstRunWizard />);

    // Navigate to step 2 where examples are shown
    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    // Find and click an example query
    const exampleButtons = screen.getAllByTestId('example-query');
    expect(exampleButtons.length).toBeGreaterThan(0);

    fireEvent.click(exampleButtons[0]);

    // Should populate the input with the example query
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBeTruthy();
    expect(input.value.length).toBeGreaterThan(0);
  });

  it('shows progress indicator', () => {
    render(<FirstRunWizard />);

    // Should show progress
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('completes the wizard and calls onComplete', () => {
    const mockOnComplete = jest.fn();

    render(<FirstRunWizard onComplete={mockOnComplete} />);

    // Navigate through all steps
    let nextButton = screen.getByText(/^next$/i);
    fireEvent.click(nextButton); // Step 2

    // Select an example query to enable next button
    const exampleButtons = screen.getAllByTestId('example-query');
    fireEvent.click(exampleButtons[0]);

    nextButton = screen.getByText(/^next$/i);
    fireEvent.click(nextButton); // Step 3

    // On final step, click "Start Analysis"
    const completeButton = screen.getByText(/start analysis/i);
    fireEvent.click(completeButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('marks wizard as complete in onboarding state', () => {
    const mockOnComplete = jest.fn();

    render(<FirstRunWizard onComplete={mockOnComplete} markComplete={true} />);

    // Navigate to final step
    let nextButton = screen.getByText(/^next$/i);
    fireEvent.click(nextButton);

    // Select an example query
    const exampleButtons = screen.getAllByTestId('example-query');
    fireEvent.click(exampleButtons[0]);

    nextButton = screen.getByText(/^next$/i);
    fireEvent.click(nextButton);

    const completeButton = screen.getByText(/start analysis/i);
    fireEvent.click(completeButton);

    expect(mockOnComplete).toHaveBeenCalledWith(expect.objectContaining({
      completed: true,
    }));
  });
});

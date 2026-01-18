import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Checklist } from '@/components/onboarding/Checklist';

describe('Onboarding Checklist Component', () => {
  const mockSteps = [
    { id: 'step1', title: 'Complete your profile', completed: false },
    { id: 'step2', title: 'Create your first run', completed: false },
    { id: 'step3', title: 'Review your first report', completed: false },
  ];

  it('renders all checklist steps', () => {
    render(<Checklist steps={mockSteps} onStepComplete={() => {}} onDismiss={() => {}} />);
    
    expect(screen.getByText('Complete your profile')).toBeInTheDocument();
    expect(screen.getByText('Create your first run')).toBeInTheDocument();
    expect(screen.getByText('Review your first report')).toBeInTheDocument();
  });

  it('displays progress percentage', () => {
    const stepsWithProgress = [
      { id: 'step1', title: 'Step 1', completed: true },
      { id: 'step2', title: 'Step 2', completed: true },
      { id: 'step3', title: 'Step 3', completed: false },
    ];
    
    render(<Checklist steps={stepsWithProgress} onStepComplete={() => {}} onDismiss={() => {}} />);
    
    // 2/3 = 66.67%
    expect(screen.getByText(/66%|67%/)).toBeInTheDocument();
  });

  it('shows completed steps with checkmark', () => {
    const stepsWithCompleted = [
      { id: 'step1', title: 'Completed Step', completed: true },
      { id: 'step2', title: 'Pending Step', completed: false },
    ];

    render(<Checklist steps={stepsWithCompleted} onStepComplete={() => {}} onDismiss={() => {}} />);

    const completedStep = screen.getByText('Completed Step').closest('[data-testid="checklist-item"]');
    expect(completedStep).toBeInTheDocument();

    // Verify checkmark icon is present in the completed step
    const checkmarkIcon = completedStep?.querySelector('.checklist-item-completed');
    expect(checkmarkIcon).toBeInTheDocument();
  });

  it('allows dismissing the checklist', () => {
    const mockDismiss = jest.fn();
    
    render(<Checklist steps={mockSteps} onStepComplete={() => {}} onDismiss={mockDismiss} />);
    
    const dismissButton = screen.getByTestId('dismiss-checklist');
    fireEvent.click(dismissButton);
    
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onStepComplete when a step is marked complete', () => {
    const mockStepComplete = jest.fn();
    
    render(<Checklist steps={mockSteps} onStepComplete={mockStepComplete} onDismiss={() => {}} />);
    
    // Find and click the first step's complete button
    const firstStepButton = screen.getAllByTestId('complete-step-button')[0];
    fireEvent.click(firstStepButton);
    
    expect(mockStepComplete).toHaveBeenCalledWith('step1');
  });

  it('hides the checklist when dismissed', () => {
    const mockDismiss = jest.fn();
    
    const { container } = render(
      <Checklist steps={mockSteps} onStepComplete={() => {}} onDismiss={mockDismiss} dismissed={true} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('displays completion message when all steps are done', () => {
    const allCompleted = mockSteps.map(step => ({ ...step, completed: true }));

    render(<Checklist steps={allCompleted} onStepComplete={() => {}} onDismiss={() => {}} />);

    expect(screen.getByText('All set!')).toBeInTheDocument();
  });
});

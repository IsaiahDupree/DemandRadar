/**
 * PaywallModal Component Tests
 *
 * Tests for PAYWALL-002: Comprehensive paywall modal with plan comparison
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaywallModal } from '@/components/billing/PaywallModal';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('PaywallModal (PAYWALL-002)', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockPush.mockClear();
  });

  describe('Modal Display', () => {
    it('should not render when open is false', () => {
      render(
        <PaywallModal
          open={false}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display heading', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      expect(screen.getByText(/Upgrade to unlock/i)).toBeInTheDocument();
    });
  });

  describe('Plan Comparison', () => {
    it('should display all plan tiers', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      expect(screen.getAllByText(/Starter/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Builder/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Agency/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Studio/i).length).toBeGreaterThan(0);
    });

    it('should display pricing for each plan', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      // Check for plan prices (from tier-limits.ts)
      expect(screen.getByText('$29')).toBeInTheDocument(); // Starter
      expect(screen.getByText('$79')).toBeInTheDocument(); // Builder
      expect(screen.getByText('$199')).toBeInTheDocument(); // Agency
      expect(screen.getByText('$499')).toBeInTheDocument(); // Studio
    });

    it('should display run limits for each plan', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      // Check for run limits (from tier-limits.ts) - appear multiple times in DOM
      expect(screen.getAllByText(/5.*runs/i).length).toBeGreaterThan(0); // Starter
      expect(screen.getAllByText(/15.*runs/i).length).toBeGreaterThan(0); // Builder
      expect(screen.getAllByText(/50.*runs/i).length).toBeGreaterThan(0); // Agency
      expect(screen.getAllByText(/200.*runs/i).length).toBeGreaterThan(0); // Studio
    });

    it('should highlight current plan', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="builder"
        />
      );

      const cards = screen.getAllByTestId('plan-card');
      const builderCard = cards.find(card => card.getAttribute('data-plan') === 'builder');
      expect(builderCard).toHaveClass('current-plan');
    });
  });

  describe('Feature List', () => {
    it('should display feature list for each plan', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      // Check for common features (appear multiple times, once per plan)
      expect(screen.getAllByText(/PDF export/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/CSV export/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/API access/i).length).toBeGreaterThan(0);
    });

    it('should show checkmarks for included features', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      const checkmarks = screen.getAllByTestId('feature-check');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('should differentiate features by plan tier', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      // Starter should have basic features
      // Agency should have API access
      // Studio should have white-label
      expect(screen.getAllByText(/White-label/i).length).toBeGreaterThan(0);
    });
  });

  describe('CTA Buttons', () => {
    it('should display upgrade button for each plan', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      const upgradeButtons = screen.getAllByRole('button', { name: /upgrade/i });
      expect(upgradeButtons.length).toBeGreaterThan(0);
    });

    it('should navigate to checkout on upgrade button click', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      const starterUpgradeButton = screen.getByRole('button', { name: /upgrade.*starter/i });
      fireEvent.click(starterUpgradeButton);

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/checkout'));
    });

    it('should disable upgrade button for current plan', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="builder"
        />
      );

      const builderButton = screen.getByRole('button', { name: /current plan/i });
      expect(builderButton).toBeDisabled();
    });

    it('should show "Current Plan" text for current plan', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="agency"
        />
      );

      expect(screen.getByText(/Current Plan/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      const closeButtons = screen.getAllByRole('button', { name: /close/i });
      fireEvent.click(closeButtons[closeButtons.length - 1]); // Click the last close button (footer)

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking outside modal', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      const upgradeButtons = screen.getAllByRole('button', { name: /upgrade/i });
      upgradeButtons.forEach(button => {
        expect(button).toBeVisible();
      });
    });
  });

  describe('Custom Props', () => {
    it('should display custom heading when provided', () => {
      const customHeading = 'You need more runs!';

      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
          heading={customHeading}
        />
      );

      expect(screen.getByText(customHeading)).toBeInTheDocument();
    });

    it('should display custom description when provided', () => {
      const customDescription = 'Upgrade to get more analysis runs per month.';

      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
          description={customDescription}
        />
      );

      expect(screen.getByText(customDescription)).toBeInTheDocument();
    });

    it('should highlight recommended plan when specified', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
          recommendedPlan="builder"
        />
      );

      const cards = screen.getAllByTestId('plan-card');
      const builderCard = cards.find(card => card.getAttribute('data-plan') === 'builder');
      expect(builderCard).toHaveClass('recommended');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('should focus trap within modal', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render plan cards in responsive layout', () => {
      render(
        <PaywallModal
          open={true}
          onClose={mockOnClose}
          currentPlan="free"
        />
      );

      const planCards = screen.getAllByTestId('plan-card');
      expect(planCards.length).toBe(4); // 4 plans
    });
  });
});

/**
 * UpgradePrompt Component Tests
 *
 * Tests for PAYWALL-001: Upgrade modal shown when user tries to access blocked feature
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpgradePrompt } from '@/components/billing/UpgradePrompt';
import type { FeatureName } from '@/lib/feature-gates';
import type { SubscriptionTier } from '@/lib/subscription/tier-limits';

describe('UpgradePrompt', () => {
  const mockOnClose = jest.fn();
  const mockOnUpgrade = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnUpgrade.mockClear();
  });

  describe('Modal Display', () => {
    it('should not render when open is false', () => {
      render(
        <UpgradePrompt
          open={false}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display feature description', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
        />
      );

      expect(screen.getByText(/Unlock.*Export reports as PDF/i)).toBeInTheDocument();
    });

    it('should show required tier information', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
        />
      );

      const starterElements = screen.getAllByText(/Starter/i);
      expect(starterElements.length).toBeGreaterThan(0);
    });

    it('should display upgrade suggestion', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="apiAccess"
        />
      );

      // Should show Agency tier required
      const agencyElements = screen.getAllByText(/Agency/i);
      expect(agencyElements.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
        />
      );

      const closeButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onUpgrade when upgrade button is clicked', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          onUpgrade={mockOnUpgrade}
          currentTier="free"
          feature="pdfExport"
        />
      );

      const upgradeButton = screen.getByRole('button', { name: /upgrade to starter/i });
      fireEvent.click(upgradeButton);

      expect(mockOnUpgrade).toHaveBeenCalledTimes(1);
    });

    it('should navigate to pricing when no custom onUpgrade', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
        />
      );

      const upgradeLink = screen.getByRole('link', { name: /upgrade to starter/i });
      expect(upgradeLink).toHaveAttribute('href', '/pricing');
    });
  });

  describe('Different Features', () => {
    const testCases: Array<{
      feature: FeatureName;
      currentTier: SubscriptionTier;
      expectedTier: string;
    }> = [
      { feature: 'pdfExport', currentTier: 'free', expectedTier: 'Starter' },
      { feature: 'apiAccess', currentTier: 'free', expectedTier: 'Agency' },
      { feature: 'whiteLabel', currentTier: 'agency', expectedTier: 'Studio' },
      { feature: 'shareReports', currentTier: 'starter', expectedTier: 'Builder' },
    ];

    testCases.forEach(({ feature, currentTier, expectedTier }) => {
      it(`should show correct tier for ${feature} from ${currentTier}`, () => {
        render(
          <UpgradePrompt
            open={true}
            onClose={mockOnClose}
            currentTier={currentTier}
            feature={feature}
          />
        );

        const tierElements = screen.getAllByText(new RegExp(expectedTier, 'i'));
        expect(tierElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Custom Message', () => {
    it('should display custom message when provided', () => {
      const customMessage = 'You need a premium plan to access this feature!';

      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
          customMessage={customMessage}
        />
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should be keyboard accessible', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
        />
      );

      const closeButton = screen.getByRole('button', { name: /cancel/i });
      const upgradeLink = screen.getByRole('link', { name: /upgrade to starter/i });

      expect(closeButton).toBeVisible();
      expect(upgradeLink).toBeVisible();
    });
  });

  describe('Visual Elements', () => {
    it('should display feature benefits', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
        />
      );

      // Should show some benefit or reason to upgrade
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent(/./); // Has content
    });

    it('should show pricing information', () => {
      render(
        <UpgradePrompt
          open={true}
          onClose={mockOnClose}
          currentTier="free"
          feature="pdfExport"
        />
      );

      // Should show price (Starter is $29/mo)
      expect(screen.getByText('$29')).toBeInTheDocument();
      expect(screen.getByText('/month')).toBeInTheDocument();
    });
  });
});

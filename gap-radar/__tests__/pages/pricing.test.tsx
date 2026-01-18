/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Mock Stripe before importing PLANS
jest.mock('@/lib/stripe', () => ({
  stripe: {},
  PLANS: {
    free: { name: 'Free', price: 0, runsLimit: 2, features: ['2 runs/month'] },
    starter: { name: 'Starter', price: 29, priceId: 'price_starter', runsLimit: 2, features: ['2 runs/month', 'Full dossiers'] },
    builder: { name: 'Builder', price: 99, priceId: 'price_builder', runsLimit: 10, features: ['10 runs/month', 'Full dossiers', 'UGC pack'] },
    agency: { name: 'Agency', price: 249, priceId: 'price_agency', runsLimit: 35, features: ['35 runs/month', 'Full dossiers', 'UGC pack', 'API access'] },
    studio: { name: 'Studio', price: 499, priceId: 'price_studio', runsLimit: 90, features: ['90 runs/month', 'Full dossiers', 'UGC pack', 'API access', 'White-label reports'] },
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

import PricingPage from '@/app/pricing/page';

describe('Pricing Page', () => {
  let mockRouter: any;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRouter = {
      push: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/pay/test' }),
    });
  });

  describe('Page Structure', () => {
    it('should render pricing page with title', () => {
      render(<PricingPage />);

      expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
    });

    it('should render navigation with GapRadar logo', () => {
      render(<PricingPage />);

      expect(screen.getByText('GapRadar')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      const getStartedButtons = screen.getAllByRole('button', { name: /Get Started/i });
      expect(getStartedButtons.length).toBeGreaterThan(0);
    });

    it('should render description text', () => {
      render(<PricingPage />);

      expect(screen.getByText(/Get market gap insights backed by real ad data/)).toBeInTheDocument();
    });

    it('should render FAQ section', () => {
      render(<PricingPage />);

      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
      expect(screen.getByText('Can I cancel anytime?')).toBeInTheDocument();
      expect(screen.getByText('What counts as a "run"?')).toBeInTheDocument();
    });
  });

  describe('Plan Tiers Display', () => {
    it('should display all 4 plan tiers', () => {
      render(<PricingPage />);

      const planCards = screen.getAllByTestId('plan-card');
      expect(planCards).toHaveLength(4);
    });

    it('should display Starter plan with correct details', () => {
      render(<PricingPage />);

      expect(screen.getByText('Starter')).toBeInTheDocument();
      expect(screen.getByText('$29')).toBeInTheDocument();
    });

    it('should display Builder plan with correct details', () => {
      render(<PricingPage />);

      expect(screen.getByText('Builder')).toBeInTheDocument();
      expect(screen.getByText('$99')).toBeInTheDocument();
    });

    it('should display Agency plan with correct details', () => {
      render(<PricingPage />);

      expect(screen.getByText('Agency')).toBeInTheDocument();
      expect(screen.getByText('$249')).toBeInTheDocument();
    });

    it('should display Studio plan with correct details', () => {
      render(<PricingPage />);

      expect(screen.getByText('Studio')).toBeInTheDocument();
      expect(screen.getByText('$499')).toBeInTheDocument();
    });

    it('should mark Builder plan as most popular', () => {
      render(<PricingPage />);

      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });
  });

  describe('Feature Comparison', () => {
    it('should display features for each plan', () => {
      render(<PricingPage />);

      // Check that feature lists are rendered (each plan has features)
      expect(screen.getByText(/2 runs\/month/)).toBeInTheDocument();
      expect(screen.getByText(/10 runs\/month/)).toBeInTheDocument();
      expect(screen.getByText(/35 runs\/month/)).toBeInTheDocument();
      expect(screen.getByText(/90 runs\/month/)).toBeInTheDocument();
    });

    it('should show check icons for features', () => {
      const { container } = render(<PricingPage />);

      // Check that there are Check icons (lucide-react Check component renders as SVG)
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('CTA Buttons', () => {
    it('should render Get Started button for each plan', () => {
      render(<PricingPage />);

      const buttons = screen.getAllByRole('button', { name: /Get Started/i });
      // 4 plan buttons + 1 nav button = 5 total
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle unauthenticated user clicking subscribe', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      render(<PricingPage />);

      const buttons = screen.getAllByRole('button', { name: /Get Started/i });
      const planButton = buttons.find(btn => btn.closest('[data-testid="plan-card"]'));

      if (planButton) {
        fireEvent.click(planButton);

        await waitFor(() => {
          expect(mockRouter.push).toHaveBeenCalled();
          expect(mockRouter.push.mock.calls[0][0]).toMatch(/\/signup\?plan=/);
        });
      }
    });

    it('should handle authenticated user clicking subscribe', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123', email: 'test@example.com' } },
      });

      render(<PricingPage />);

      const buttons = screen.getAllByRole('button', { name: /Get Started/i });
      const planButton = buttons.find(btn => btn.closest('[data-testid="plan-card"]'));

      if (planButton) {
        fireEvent.click(planButton);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith('/api/checkout', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('plan'),
          }));
        });
      }
    });

    it('should show loading state when checkout is processing', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123' } },
      });

      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ url: 'https://checkout.stripe.com/pay/test' }),
        }), 100))
      );

      render(<PricingPage />);

      const buttons = screen.getAllByRole('button', { name: /Get Started/i });
      const planButton = buttons.find(btn => btn.closest('[data-testid="plan-card"]'));

      if (planButton) {
        fireEvent.click(planButton);

        // Should show loading text
        await waitFor(() => {
          expect(screen.getByText('Loading...')).toBeInTheDocument();
        });
      }
    });

    it('should handle checkout errors gracefully', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123' } },
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      // Mock alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<PricingPage />);

      const buttons = screen.getAllByRole('button', { name: /Get Started/i });
      const planButton = buttons.find(btn => btn.closest('[data-testid="plan-card"]'));

      if (planButton) {
        fireEvent.click(planButton);

        await waitFor(() => {
          expect(alertSpy).toHaveBeenCalledWith('Failed to start checkout. Please try again.');
        });
      }

      alertSpy.mockRestore();
    });
  });

  describe('Navigation Links', () => {
    it('should have working navigation links', () => {
      const { container } = render(<PricingPage />);

      const signInLink = screen.getByText('Sign In').closest('a');
      expect(signInLink).toHaveAttribute('href', '/login');

      const logoLink = container.querySelector('a[href="/"]');
      expect(logoLink).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(<PricingPage />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });
  });
});

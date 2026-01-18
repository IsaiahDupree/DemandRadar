/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { UpsellBanner } from '@/components/UpsellBanner';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('UpsellBanner', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all cookies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  });

  it('should render the banner when not dismissed', () => {
    render(<UpsellBanner tier="free" />);

    expect(screen.getByText(/upgrade to unlock/i)).toBeInTheDocument();
  });

  it('should show contextual message for free tier', () => {
    render(<UpsellBanner tier="free" />);

    // Should mention upgrading from free
    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();
  });

  it('should show contextual message for starter tier', () => {
    render(<UpsellBanner tier="starter" />);

    // Should show starter-specific messaging
    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();
  });

  it('should not render for agency and studio tiers', () => {
    const { container: agencyContainer } = render(<UpsellBanner tier="agency" />);
    expect(agencyContainer.firstChild).toBeNull();

    const { container: studioContainer } = render(<UpsellBanner tier="studio" />);
    expect(studioContainer.firstChild).toBeNull();
  });

  it('should have a CTA link to pricing page', () => {
    render(<UpsellBanner tier="free" />);

    const links = screen.getAllByRole('link', { name: /upgrade/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/pricing');
  });

  it('should be dismissible', () => {
    render(<UpsellBanner tier="free" />);

    const dismissButton = screen.getByRole('button', { name: /dismiss|close/i });
    expect(dismissButton).toBeInTheDocument();

    fireEvent.click(dismissButton);

    // Banner should be removed
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('should persist dismissal in localStorage', () => {
    render(<UpsellBanner tier="free" />);

    const dismissButton = screen.getByRole('button', { name: /dismiss|close/i });
    fireEvent.click(dismissButton);

    // Check localStorage
    const dismissedBanners = JSON.parse(localStorage.getItem('dismissedBanners') || '{}');
    expect(dismissedBanners.upsell).toBeTruthy();
  });

  it('should not render if previously dismissed', () => {
    // Set dismissed state in localStorage
    localStorage.setItem('dismissedBanners', JSON.stringify({ upsell: true }));

    const { container } = render(<UpsellBanner tier="free" />);

    expect(container.firstChild).toBeNull();
  });

  it('should show different messages for different tiers', () => {
    const { rerender } = render(<UpsellBanner tier="free" />);
    const freeMessage = screen.getByRole('banner').textContent;

    rerender(<UpsellBanner tier="starter" />);
    const starterMessage = screen.getByRole('banner').textContent;

    // Messages should be different
    expect(freeMessage).not.toBe(starterMessage);
  });

  it('should support custom message override', () => {
    const customMessage = 'This is a custom upsell message!';
    render(<UpsellBanner tier="free" message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<UpsellBanner tier="free" />);

    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();

    // Should have close button with proper aria-label
    const closeButton = screen.getByRole('button', { name: /dismiss|close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should handle missing localStorage gracefully', () => {
    // Mock localStorage to throw error
    const originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: () => { throw new Error('localStorage disabled'); },
        setItem: () => { throw new Error('localStorage disabled'); },
        removeItem: () => { throw new Error('localStorage disabled'); },
        clear: () => { throw new Error('localStorage disabled'); },
      },
      writable: true,
      configurable: true,
    });

    // Should not crash
    expect(() => render(<UpsellBanner tier="free" />)).not.toThrow();

    // Restore localStorage
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });
});

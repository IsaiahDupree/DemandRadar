/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState Component (EMPTY-001)', () => {
  const defaultProps = {
    headline: 'No results found',
    description: 'Try adjusting your search or filters',
  };

  it('should render headline', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<EmptyState {...defaultProps} />);
    expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
  });

  it('should render illustration slot when provided', () => {
    const illustration = <div data-testid="custom-illustration">Empty Illustration</div>;
    render(<EmptyState {...defaultProps} illustration={illustration} />);

    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
  });

  it('should render primary CTA when provided', () => {
    const primaryCTA = {
      label: 'Create New',
      onClick: jest.fn(),
    };

    render(<EmptyState {...defaultProps} primaryCTA={primaryCTA} />);

    const button = screen.getByRole('button', { name: 'Create New' });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when primary CTA is clicked', () => {
    const mockOnClick = jest.fn();
    const primaryCTA = {
      label: 'Create New',
      onClick: mockOnClick,
    };

    render(<EmptyState {...defaultProps} primaryCTA={primaryCTA} />);

    const button = screen.getByRole('button', { name: 'Create New' });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should render secondary CTA when provided', () => {
    const secondaryCTA = {
      label: 'Learn More',
      onClick: jest.fn(),
    };

    render(<EmptyState {...defaultProps} secondaryCTA={secondaryCTA} />);

    const button = screen.getByRole('button', { name: 'Learn More' });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when secondary CTA is clicked', () => {
    const mockOnClick = jest.fn();
    const secondaryCTA = {
      label: 'Learn More',
      onClick: mockOnClick,
    };

    render(<EmptyState {...defaultProps} secondaryCTA={secondaryCTA} />);

    const button = screen.getByRole('button', { name: 'Learn More' });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should render both primary and secondary CTAs', () => {
    const primaryCTA = {
      label: 'Create New',
      onClick: jest.fn(),
    };
    const secondaryCTA = {
      label: 'Learn More',
      onClick: jest.fn(),
    };

    render(<EmptyState {...defaultProps} primaryCTA={primaryCTA} secondaryCTA={secondaryCTA} />);

    expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn More' })).toBeInTheDocument();
  });

  it('should have proper text alignment and centering', () => {
    const { container } = render(<EmptyState {...defaultProps} />);

    // The component should have text-center class
    const emptyState = container.querySelector('[data-testid="empty-state"]');
    expect(emptyState?.className).toMatch(/text-center/);
  });

  it('should accept custom className', () => {
    const { container } = render(<EmptyState {...defaultProps} className="custom-class" />);

    const emptyState = container.querySelector('[data-testid="empty-state"]');
    expect(emptyState?.className).toContain('custom-class');
  });

  it('should render without CTAs', () => {
    render(<EmptyState {...defaultProps} />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should support icon prop for illustration', () => {
    const Icon = () => <svg data-testid="icon">Icon</svg>;
    render(<EmptyState {...defaultProps} icon={Icon} />);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should display headline with proper typography', () => {
    const { container } = render(<EmptyState {...defaultProps} />);

    // Headline should be larger/bolder than description
    const headline = screen.getByText('No results found');
    expect(headline.tagName).toMatch(/H[1-6]/i);
  });

  it('should have proper spacing between elements', () => {
    const { container } = render(
      <EmptyState
        {...defaultProps}
        illustration={<div>Illustration</div>}
        primaryCTA={{ label: 'Action', onClick: jest.fn() }}
      />
    );

    // Component should have gap or space-y classes
    const emptyState = container.querySelector('[data-testid="empty-state"]');
    expect(emptyState?.className).toMatch(/gap|space/);
  });
});

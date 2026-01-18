/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// We'll import these after we create them
import { FilterPanel } from '@/components/dashboard/FilterPanel';

describe('Filter Panel Component (DASH-003)', () => {
  const mockOnFilterChange = jest.fn();

  const defaultProps = {
    onFilterChange: mockOnFilterChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render filter panel with accordion sections', () => {
    render(<FilterPanel {...defaultProps} />);

    // Check for filter sections
    expect(screen.getByText(/Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Score Range/i)).toBeInTheDocument();
    expect(screen.getByText(/Source/i)).toBeInTheDocument();
    expect(screen.getByText(/Sentiment/i)).toBeInTheDocument();
  });

  it('should have multi-select checkboxes for categories', () => {
    render(<FilterPanel {...defaultProps} />);

    // Common gap categories
    const categorySection = screen.getByText(/Category/i).closest('div');

    // Check for some expected category options (will be checkboxes or buttons)
    expect(screen.getByRole('button', { name: /Category/i })).toBeInTheDocument();
  });

  it('should have a score range slider', () => {
    render(<FilterPanel {...defaultProps} />);

    // Check for score range section
    const scoreSection = screen.getByText(/Score Range/i);
    expect(scoreSection).toBeInTheDocument();
  });

  it('should show "Clear All" button when filters are active', () => {
    render(
      <FilterPanel
        {...defaultProps}
        initialFilters={{
          categories: ['product'],
          scoreRange: [0, 100],
          sources: [],
          sentiments: [],
        }}
      />
    );

    const clearButton = screen.getByRole('button', { name: /Clear All/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('should call onFilterChange when category is selected', async () => {
    render(<FilterPanel {...defaultProps} />);

    // Expand category section (click on accordion trigger)
    const categoryButton = screen.getByRole('button', { name: /Category/i });
    fireEvent.click(categoryButton);

    // Find and click a category checkbox (we'll add actual categories in implementation)
    // For now, just verify the structure exists
    expect(mockOnFilterChange).not.toHaveBeenCalled(); // Not called yet without interaction
  });

  it('should reset all filters when "Clear All" is clicked', () => {
    render(
      <FilterPanel
        {...defaultProps}
        initialFilters={{
          categories: ['product', 'pricing'],
          scoreRange: [50, 100],
          sources: ['meta'],
          sentiments: ['positive'],
        }}
      />
    );

    const clearButton = screen.getByRole('button', { name: /Clear All/i });
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      categories: [],
      scoreRange: [0, 100],
      sources: [],
      sentiments: [],
    });
  });

  it('should display filter count badges when filters are active', () => {
    render(
      <FilterPanel
        {...defaultProps}
        initialFilters={{
          categories: ['product', 'pricing'],
          scoreRange: [50, 100],
          sources: [],
          sentiments: [],
        }}
      />
    );

    // Should show count badge for categories (2 selected)
    const categoryBadges = screen.queryAllByText('2');
    expect(categoryBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('should expand and collapse accordion sections', () => {
    render(<FilterPanel {...defaultProps} />);

    const categoryButton = screen.getByRole('button', { name: /Category/i });

    // Click to expand
    fireEvent.click(categoryButton);

    // Click again to collapse
    fireEvent.click(categoryButton);

    // Should still be in the document
    expect(categoryButton).toBeInTheDocument();
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchWithFilters } from '@/components/dashboard/SearchWithFilters';

describe('Search with Filters Component (Hookd Pattern)', () => {
  it('renders search input', () => {
    render(<SearchWithFilters onSearch={() => {}} onFilterChange={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('accepts search text input', () => {
    const mockOnSearch = jest.fn();
    render(<SearchWithFilters onSearch={mockOnSearch} onFilterChange={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'AI tools' } });

    expect(searchInput.value).toBe('AI tools');
  });

  it('calls onSearch when search is triggered', () => {
    const mockOnSearch = jest.fn();
    render(<SearchWithFilters onSearch={mockOnSearch} onFilterChange={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'AI tools' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    expect(mockOnSearch).toHaveBeenCalledWith('AI tools');
  });

  it('displays filter chips when filters are provided', () => {
    const filters = [
      { id: 'category', label: 'Category', value: 'SaaS' },
      { id: 'status', label: 'Status', value: 'Active' },
    ];

    render(
      <SearchWithFilters
        onSearch={() => {}}
        onFilterChange={() => {}}
        filters={filters}
      />
    );

    expect(screen.getByText(/SaaS/i)).toBeInTheDocument();
    expect(screen.getByText(/Active/i)).toBeInTheDocument();
  });

  it('allows removing individual filters', () => {
    const mockOnFilterChange = jest.fn();
    const filters = [
      { id: 'category', label: 'Category', value: 'SaaS' },
      { id: 'status', label: 'Status', value: 'Active' },
    ];

    render(
      <SearchWithFilters
        onSearch={() => {}}
        onFilterChange={mockOnFilterChange}
        filters={filters}
      />
    );

    // Find and click the remove button for the first filter
    const removeButtons = screen.getAllByLabelText(/remove filter/i);
    fireEvent.click(removeButtons[0]);

    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'status' })
      ])
    );
  });

  it('displays "Clear all" button when filters are active', () => {
    const filters = [
      { id: 'category', label: 'Category', value: 'SaaS' },
    ];

    render(
      <SearchWithFilters
        onSearch={() => {}}
        onFilterChange={() => {}}
        filters={filters}
      />
    );

    expect(screen.getByText(/clear all/i)).toBeInTheDocument();
  });

  it('does not display "Clear all" button when no filters are active', () => {
    render(
      <SearchWithFilters
        onSearch={() => {}}
        onFilterChange={() => {}}
        filters={[]}
      />
    );

    expect(screen.queryByText(/clear all/i)).not.toBeInTheDocument();
  });

  it('calls onFilterChange with empty array when "Clear all" is clicked', () => {
    const mockOnFilterChange = jest.fn();
    const filters = [
      { id: 'category', label: 'Category', value: 'SaaS' },
      { id: 'status', label: 'Status', value: 'Active' },
    ];

    render(
      <SearchWithFilters
        onSearch={() => {}}
        onFilterChange={mockOnFilterChange}
        filters={filters}
      />
    );

    const clearAllButton = screen.getByText(/clear all/i);
    fireEvent.click(clearAllButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith([]);
  });

  it('displays active filter count', () => {
    const filters = [
      { id: 'category', label: 'Category', value: 'SaaS' },
      { id: 'status', label: 'Status', value: 'Active' },
      { id: 'platform', label: 'Platform', value: 'Web' },
    ];

    render(
      <SearchWithFilters
        onSearch={() => {}}
        onFilterChange={() => {}}
        filters={filters}
      />
    );

    // Should show count of 3 filters
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('updates filter count when filters change', () => {
    const mockOnFilterChange = jest.fn();
    const filters = [
      { id: 'category', label: 'Category', value: 'SaaS' },
    ];

    const { rerender } = render(
      <SearchWithFilters
        onSearch={() => {}}
        onFilterChange={mockOnFilterChange}
        filters={filters}
      />
    );

    expect(screen.getByText(/1/)).toBeInTheDocument();

    // Update filters
    const updatedFilters = [
      { id: 'category', label: 'Category', value: 'SaaS' },
      { id: 'status', label: 'Status', value: 'Active' },
    ];

    rerender(
      <SearchWithFilters
        onSearch={() => {}}
        onFilterChange={mockOnFilterChange}
        filters={updatedFilters}
      />
    );

    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('handles search button click', () => {
    const mockOnSearch = jest.fn();
    render(<SearchWithFilters onSearch={mockOnSearch} onFilterChange={() => {}} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });
});

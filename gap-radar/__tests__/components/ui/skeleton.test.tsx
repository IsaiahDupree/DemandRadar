/**
 * Skeleton Component Tests
 * Tests for skeleton loading states
 */

import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonReport } from '@/components/ui/skeleton';

describe('Skeleton Component', () => {
  describe('Base Skeleton', () => {
    it('renders with default styles', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('rounded-md');
    });

    it('accepts custom className', () => {
      const { container } = render(<Skeleton className="h-10 w-full" />);
      const skeleton = container.querySelector('[data-slot="skeleton"]');

      expect(skeleton).toHaveClass('h-10');
      expect(skeleton).toHaveClass('w-full');
    });
  });

  describe('SkeletonCard', () => {
    it('renders card skeleton with correct structure', () => {
      const { container } = render(<SkeletonCard />);

      // Should have a card container
      expect(container.firstChild).toBeInTheDocument();

      // Should have skeleton elements for header, content, etc.
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders multiple skeleton elements for card content', () => {
      const { container } = render(<SkeletonCard />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');

      // Card should have at least title and content skeletons
      expect(skeletons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SkeletonList', () => {
    it('renders list skeleton with default items', () => {
      const { container } = render(<SkeletonList />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');

      // Default should show 3 items
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('renders specified number of items', () => {
      const { container } = render(<SkeletonList items={5} />);

      // Should render items based on prop
      const listItems = container.querySelectorAll('.space-y-2 > div, .space-y-3 > div, .space-y-4 > div');
      expect(listItems.length).toBeGreaterThanOrEqual(5);
    });

    it('renders items with skeleton elements', () => {
      const { container } = render(<SkeletonList items={2} />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');

      // Each item should have at least one skeleton
      expect(skeletons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SkeletonReport', () => {
    it('renders report section skeleton', () => {
      const { container } = render(<SkeletonReport />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');

      // Report should have multiple sections (header, stats, content)
      expect(skeletons.length).toBeGreaterThanOrEqual(3);
    });

    it('renders report with header skeleton', () => {
      const { container } = render(<SkeletonReport />);

      // Should have a larger skeleton for header/title
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders report with content sections', () => {
      const { container } = render(<SkeletonReport />);
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');

      // Should have multiple skeleton elements for different sections
      expect(skeletons.length).toBeGreaterThanOrEqual(5);
    });
  });
});

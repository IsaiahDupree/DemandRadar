/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GuidePage from '@/app/dashboard/guide/page';

describe('Success Guide Page', () => {
  describe('Page Structure', () => {
    it('should render success guide page with title', () => {
      render(<GuidePage />);

      expect(screen.getByText('Success Guide')).toBeInTheDocument();
    });

    it('should render page description', () => {
      render(<GuidePage />);

      expect(screen.getByText(/Feature explainers, best practices, and video tutorials/i)).toBeInTheDocument();
    });

    it('should have navigation back to dashboard', () => {
      render(<GuidePage />);

      const backLink = screen.getByText('Back to Dashboard');
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Feature Documentation', () => {
    it('should display Getting Started section', () => {
      render(<GuidePage />);

      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });

    it('should display How to Run Your First Analysis section', () => {
      render(<GuidePage />);

      const elements = screen.getAllByText(/How to Run Your First Analysis/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should display Understanding Your Report section', () => {
      render(<GuidePage />);

      expect(screen.getByText(/Understanding Your Report/i)).toBeInTheDocument();
    });

    it('should display Working with Gaps section', () => {
      render(<GuidePage />);

      expect(screen.getByText(/Working with Gaps/i)).toBeInTheDocument();
    });

    it('should display feature documentation content', () => {
      render(<GuidePage />);

      // Check for key feature documentation content
      const elements = screen.getAllByText(/niche/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Best Practices Section', () => {
    it('should display Best Practices heading', () => {
      render(<GuidePage />);

      expect(screen.getByText('Best Practices')).toBeInTheDocument();
    });

    it('should list best practice tips', () => {
      render(<GuidePage />);

      // Check for some best practices
      const elements = screen.getAllByText(/specific/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should have expandable practice cards', () => {
      const { container } = render(<GuidePage />);

      // Should have multiple cards for different practices
      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Video Tutorials Section', () => {
    it('should display Video Tutorials heading', () => {
      render(<GuidePage />);

      expect(screen.getByText('Video Tutorials')).toBeInTheDocument();
    });

    it('should have video embed placeholders', () => {
      const { container } = render(<GuidePage />);

      // Check for iframe or video elements
      const videoSections = container.querySelectorAll('[class*="video"], iframe');
      expect(videoSections.length).toBeGreaterThan(0);
    });

    it('should display tutorial titles', () => {
      render(<GuidePage />);

      // Should have at least one tutorial title
      const elements = screen.getAllByText(/tutorial/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Layout and Organization', () => {
    it('should organize content in sections', () => {
      const { container } = render(<GuidePage />);

      // Should have multiple section containers
      const sections = container.querySelectorAll('section, [class*="section"]');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should use card components for content organization', () => {
      const { container } = render(<GuidePage />);

      // Should have cards for organizing content
      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThan(2);
    });

    it('should have proper spacing and layout classes', () => {
      const { container } = render(<GuidePage />);

      // Check for spacing utility classes
      const mainContainer = container.querySelector('[class*="space-y"]');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have max-width constraint for readability', () => {
      const { container } = render(<GuidePage />);

      const mainContent = container.querySelector('[class*="max-w"]');
      expect(mainContent).toBeInTheDocument();
    });

    it('should use grid layout for video tutorials', () => {
      const { container } = render(<GuidePage />);

      // Video section should use grid for responsive layout
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});

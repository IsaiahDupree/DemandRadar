/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Helper to render sidebar with provider
const renderSidebar = () => {
  return render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>
  );
};

describe('Dashboard Layout Components (DASH-001)', () => {
  describe('AppSidebar', () => {
    it('should render GapRadar branding', () => {
      renderSidebar();

      expect(screen.getByText('GapRadar')).toBeInTheDocument();
      expect(screen.getByText('Market Gap Analysis')).toBeInTheDocument();
    });

    it('should render main navigation items', () => {
      renderSidebar();

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('My Niches')).toBeInTheDocument();
      expect(screen.getByText('New Analysis')).toBeInTheDocument();
      expect(screen.getByText('Runs')).toBeInTheDocument();
    });

    it('should render analysis navigation items', () => {
      renderSidebar();

      expect(screen.getByText('Gap Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Product Ideas')).toBeInTheDocument();
      expect(screen.getByText('UGC Winners')).toBeInTheDocument();
      expect(screen.getByText('Market Trends')).toBeInTheDocument();
    });

    it('should render settings navigation items', () => {
      renderSidebar();

      const reportLinks = screen.getAllByText('Reports');
      expect(reportLinks.length).toBeGreaterThan(0);

      const settingsLinks = screen.getAllByText('Settings');
      expect(settingsLinks.length).toBeGreaterThan(0);
    });

    it('should render user menu', () => {
      renderSidebar();

      expect(screen.getByText('Isaiah Dupree')).toBeInTheDocument();
    });

    it('should have navigation links with correct hrefs', () => {
      renderSidebar();

      const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      const nichesLink = screen.getByRole('link', { name: /My Niches/i });
      expect(nichesLink).toHaveAttribute('href', '/dashboard/niches');

      const newAnalysisLink = screen.getByRole('link', { name: /New Analysis/i });
      expect(newAnalysisLink).toHaveAttribute('href', '/dashboard/new-run');

      const runsLink = screen.getByRole('link', { name: /Runs/i });
      expect(runsLink).toHaveAttribute('href', '/dashboard/runs');
    });

    it('should organize navigation items in groups', () => {
      renderSidebar();

      expect(screen.getByText('Main')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      const settingsHeaders = screen.getAllByText('Settings');
      expect(settingsHeaders.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Tests for Signal Deep Dive Modal Component
 * Feature: UDS-006
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SignalDeepDive } from '@/components/SignalDeepDive';

describe('SignalDeepDive', () => {
  const mockPainData = {
    signal: 'pain_score' as const,
    signalName: 'Pain Points',
    score: 80,
    data: {
      sources: ['r/SaaS', 'r/Entrepreneur'],
      evidence: [
        { text: 'Current tools are too expensive', votes: 145, source: 'r/SaaS' },
        { text: 'Need better export options', votes: 98, source: 'r/Entrepreneur' },
      ],
    },
  };

  const mockSearchData = {
    signal: 'search_score' as const,
    signalName: 'Search Demand',
    score: 60,
    data: {
      sources: ['Google Trends'],
      evidence: [
        { keyword: 'best crm software', volume: 12000, trend: 'rising' },
        { keyword: 'crm alternative', volume: 8500, trend: 'stable' },
      ],
    },
  };

  it('should render when open', () => {
    render(
      <SignalDeepDive
        open={true}
        onOpenChange={() => {}}
        signalData={mockPainData}
      />
    );

    expect(screen.getByText('Pain Points')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <SignalDeepDive
        open={false}
        onOpenChange={() => {}}
        signalData={mockPainData}
      />
    );

    // Dialog should not be visible when closed
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should display sources', () => {
    render(
      <SignalDeepDive
        open={true}
        onOpenChange={() => {}}
        signalData={mockPainData}
      />
    );

    // Sources appear in multiple places (badge and evidence), so use getAllByText
    const saasElements = screen.getAllByText('r/SaaS');
    expect(saasElements.length).toBeGreaterThan(0);
    const entrepreneurElements = screen.getAllByText('r/Entrepreneur');
    expect(entrepreneurElements.length).toBeGreaterThan(0);
  });

  it('should display evidence for pain signals', () => {
    render(
      <SignalDeepDive
        open={true}
        onOpenChange={() => {}}
        signalData={mockPainData}
      />
    );

    expect(screen.getByText(/Current tools are too expensive/i)).toBeInTheDocument();
    expect(screen.getByText(/Need better export options/i)).toBeInTheDocument();
    expect(screen.getByText(/145.*upvotes/i)).toBeInTheDocument();
    expect(screen.getByText(/98.*upvotes/i)).toBeInTheDocument();
  });

  it('should display evidence for search signals', () => {
    render(
      <SignalDeepDive
        open={true}
        onOpenChange={() => {}}
        signalData={mockSearchData}
      />
    );

    expect(screen.getByText('best crm software')).toBeInTheDocument();
    expect(screen.getByText('crm alternative')).toBeInTheDocument();
    expect(screen.getByText(/12000.*monthly searches/i)).toBeInTheDocument();
    expect(screen.getByText(/8500.*monthly searches/i)).toBeInTheDocument();
  });

  it('should call onOpenChange when close button is clicked', () => {
    const handleOpenChange = jest.fn();

    render(
      <SignalDeepDive
        open={true}
        onOpenChange={handleOpenChange}
        signalData={mockPainData}
      />
    );

    // Find and click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('should handle null data gracefully', () => {
    render(
      <SignalDeepDive
        open={true}
        onOpenChange={() => {}}
        signalData={null}
      />
    );

    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });
});

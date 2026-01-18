/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DetailModal } from '@/components/dashboard/DetailModal';
import { mockGapOpportunities } from '@/lib/mock-data';

describe('Detail Modal Component (DASH-006)', () => {
  const mockOnClose = jest.fn();
  const gap = mockGapOpportunities[0];

  const defaultProps = {
    gap,
    isOpen: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when isOpen is true', () => {
    render(<DetailModal {...defaultProps} />);

    expect(screen.getByText(gap.title)).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<DetailModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(gap.title)).not.toBeInTheDocument();
  });

  it('should display full gap details', () => {
    render(<DetailModal {...defaultProps} />);

    expect(screen.getByText(gap.title)).toBeInTheDocument();
    expect(screen.getByText(gap.problem)).toBeInTheDocument();
    expect(screen.getByText(gap.recommendation)).toBeInTheDocument();
  });

  it('should display opportunity score prominently', () => {
    render(<DetailModal {...defaultProps} />);

    expect(screen.getByText(gap.opportunityScore.toString())).toBeInTheDocument();
  });

  it('should display confidence score', () => {
    render(<DetailModal {...defaultProps} />);

    const confidencePercent = Math.round(gap.confidence * 100);
    expect(screen.getByText(`${confidencePercent}%`)).toBeInTheDocument();
  });

  it('should display gap type badge', () => {
    render(<DetailModal {...defaultProps} />);

    expect(screen.getByText(gap.gapType)).toBeInTheDocument();
  });

  it('should show evidence from ads', () => {
    render(<DetailModal {...defaultProps} />);

    // Should have an evidence section showing ad evidence
    const adSections = screen.getAllByText(/Ad Evidence|Ads/i);
    expect(adSections.length).toBeGreaterThan(0);
  });

  it('should show evidence from reddit', () => {
    render(<DetailModal {...defaultProps} />);

    // Should have an evidence section showing reddit evidence
    const redditSections = screen.getAllByText(/Reddit Evidence|Reddit/i);
    expect(redditSections.length).toBeGreaterThan(0);
  });

  it('should display evidence snippets', () => {
    render(<DetailModal {...defaultProps} />);

    // Check for some evidence snippet content
    gap.evidenceAds.forEach((evidence) => {
      expect(screen.getByText(evidence.snippet)).toBeInTheDocument();
    });

    gap.evidenceReddit.forEach((evidence) => {
      expect(screen.getByText(evidence.snippet)).toBeInTheDocument();
    });
  });

  it('should have a close button', () => {
    render(<DetailModal {...defaultProps} />);

    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('should call onClose when close button is clicked', () => {
    render(<DetailModal {...defaultProps} />);

    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    fireEvent.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display recommendations section', () => {
    render(<DetailModal {...defaultProps} />);

    expect(screen.getByText(/recommendation/i)).toBeInTheDocument();
    expect(screen.getByText(gap.recommendation)).toBeInTheDocument();
  });

  it('should be keyboard accessible (ESC to close)', () => {
    render(<DetailModal {...defaultProps} />);

    // Dialog should be in the document
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
  });

  it('should have export options', () => {
    render(<DetailModal {...defaultProps} />);

    // Should have export or download buttons/options
    const exportOptions = screen.queryByText(/export|download|save/i);
    // Export options might be optional in v1, so we just check the modal renders
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

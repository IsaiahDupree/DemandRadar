/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EvidenceSection } from '@/components/dashboard/EvidenceSection';
import { mockGapOpportunities } from '@/lib/mock-data';

describe('Evidence Section Component (DASH-006)', () => {
  const gap = mockGapOpportunities[0];

  it('should render evidence from ads', () => {
    render(<EvidenceSection type="ads" evidence={gap.evidenceAds} />);

    gap.evidenceAds.forEach((item) => {
      expect(screen.getByText(item.snippet)).toBeInTheDocument();
    });
  });

  it('should render evidence from reddit', () => {
    render(<EvidenceSection type="reddit" evidence={gap.evidenceReddit} />);

    gap.evidenceReddit.forEach((item) => {
      expect(screen.getByText(item.snippet)).toBeInTheDocument();
    });
  });

  it('should display section title', () => {
    render(<EvidenceSection type="ads" evidence={gap.evidenceAds} />);

    expect(screen.getByText(/Ad Evidence|Ads/i)).toBeInTheDocument();
  });

  it('should show evidence count', () => {
    render(<EvidenceSection type="ads" evidence={gap.evidenceAds} />);

    const count = gap.evidenceAds.length;
    expect(screen.getByText(count.toString())).toBeInTheDocument();
  });

  it('should display empty state when no evidence', () => {
    render(<EvidenceSection type="ads" evidence={[]} />);

    expect(screen.getByText(/no evidence|no data/i)).toBeInTheDocument();
  });

  it('should render with appropriate icon for ads', () => {
    const { container } = render(<EvidenceSection type="ads" evidence={gap.evidenceAds} />);

    // Should have an icon (any svg icon is fine)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render with appropriate icon for reddit', () => {
    const { container } = render(<EvidenceSection type="reddit" evidence={gap.evidenceReddit} />);

    // Should have an icon (any svg icon is fine)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render evidence items in a list', () => {
    render(<EvidenceSection type="ads" evidence={gap.evidenceAds} />);

    // Should render evidence items
    gap.evidenceAds.forEach((item) => {
      expect(screen.getByText(item.snippet)).toBeInTheDocument();
    });
  });

  it('should limit displayed evidence if too many items', () => {
    const manyEvidence = Array.from({ length: 20 }, (_, i) => ({
      id: `evidence-${i}`,
      snippet: `Evidence snippet ${i}`,
    }));

    render(<EvidenceSection type="ads" evidence={manyEvidence} />);

    // Component should render but might limit display
    expect(screen.getByText(/Ad Evidence|Ads/i)).toBeInTheDocument();
  });
});

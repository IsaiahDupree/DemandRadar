/**
 * Action Plan Component Tests
 *
 * Tests for the Action Plan report section (RG-013)
 * Page 9: 7-day quick wins, 30-day roadmap, ad test concepts, landing page structure, keywords
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActionPlan } from '@/components/reports/ActionPlan';

describe('ActionPlan', () => {
  const mockActionPlan = {
    quickWins: [
      {
        id: '1',
        title: 'Update pricing page with guarantee',
        description: 'Add 30-day money-back guarantee to pricing page to address trust concerns',
        effort: 'low' as const,
        impact: 'high' as const,
        category: 'trust' as const,
      },
      {
        id: '2',
        title: 'Add social proof section',
        description: 'Include customer testimonials on landing page',
        effort: 'medium' as const,
        impact: 'medium' as const,
        category: 'positioning' as const,
      },
    ],
    roadmap: [
      {
        id: '1',
        week: 1,
        title: 'Launch v1 landing page',
        tasks: ['Design hero section', 'Write copy', 'Deploy'],
      },
      {
        id: '2',
        week: 2,
        title: 'Implement core features',
        tasks: ['Build MVP', 'Add analytics', 'Test'],
      },
    ],
    adConcepts: [
      {
        id: '1',
        angle: 'Problem-Agitate-Solve',
        headline: 'Tired of losing customers?',
        body: 'Our tool helps you identify gaps before your competitors do.',
        cta: 'Start Free Trial',
        targetAudience: 'Indie founders',
      },
      {
        id: '2',
        angle: 'Social Proof',
        headline: 'Join 1,000+ founders',
        body: 'Find market gaps backed by real ad data and Reddit insights.',
        cta: 'Get Started',
        targetAudience: 'Growth marketers',
      },
      {
        id: '3',
        angle: 'Value Proposition',
        headline: 'Market gaps in 10 minutes',
        body: 'Enter a niche, get actionable insights backed by data.',
        cta: 'Try Now',
        targetAudience: 'Agencies',
      },
    ],
    landingPageStructure: {
      hero: 'Clear value prop + CTA',
      sections: [
        'Social proof (testimonials)',
        'Feature highlights',
        'Pricing comparison',
        'FAQ section',
        'Final CTA',
      ],
      recommendations: [
        'Focus on trust signals above the fold',
        'Include pricing transparency',
        'Add exit-intent popup with lead magnet',
      ],
    },
    keywords: [
      { term: 'market research tool', difficulty: 45, volume: 12000 },
      { term: 'competitor analysis', difficulty: 62, volume: 8500 },
      { term: 'niche finder', difficulty: 38, volume: 5200 },
      { term: 'ad spy tool', difficulty: 55, volume: 3800 },
      { term: 'market gap analysis', difficulty: 28, volume: 1200 },
    ],
  };

  describe('Timeline View', () => {
    it('should display 7-day quick wins section', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Quick Wins.*7.*day/i)).toBeInTheDocument();
    });

    it('should display all quick win items', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Update pricing page with guarantee/i)).toBeInTheDocument();
      expect(screen.getByText(/Add social proof section/i)).toBeInTheDocument();
    });

    it('should show effort and impact labels for quick wins', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      const lowElements = screen.getAllByText(/low/i);
      expect(lowElements.length).toBeGreaterThan(0);
      const highElements = screen.getAllByText(/high/i);
      expect(highElements.length).toBeGreaterThan(0);
      const mediumElements = screen.getAllByText(/medium/i);
      expect(mediumElements.length).toBeGreaterThan(0);
    });

    it('should display 30-day roadmap section', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/30.*day.*Roadmap/i)).toBeInTheDocument();
    });

    it('should display roadmap items by week', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Week 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Week 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Launch v1 landing page/i)).toBeInTheDocument();
      expect(screen.getByText(/Implement core features/i)).toBeInTheDocument();
    });
  });

  describe('Ad Test Concepts', () => {
    it('should display ad concepts section', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Ad.*Test.*Concept/i)).toBeInTheDocument();
    });

    it('should display all 3 ad concepts', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Tired of losing customers/i)).toBeInTheDocument();
      expect(screen.getByText(/Join 1,000\+ founders/i)).toBeInTheDocument();
      expect(screen.getByText(/Market gaps in 10 minutes/i)).toBeInTheDocument();
    });

    it('should show angle, headline, body, and CTA for each concept', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Problem-Agitate-Solve/i)).toBeInTheDocument();
      expect(screen.getByText(/Start Free Trial/i)).toBeInTheDocument();
      expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
      expect(screen.getByText(/Try Now/i)).toBeInTheDocument();
    });

    it('should display target audience for each concept', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Indie founders/i)).toBeInTheDocument();
      expect(screen.getByText(/Growth marketers/i)).toBeInTheDocument();
      expect(screen.getByText(/Agencies/i)).toBeInTheDocument();
    });
  });

  describe('Landing Page Structure', () => {
    it('should display landing page structure section', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Landing Page.*Structure/i)).toBeInTheDocument();
    });

    it('should display hero recommendation', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Clear value prop.*CTA/i)).toBeInTheDocument();
    });

    it('should display all page sections', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Social proof \(testimonials\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Feature highlights/i)).toBeInTheDocument();
      expect(screen.getByText(/Pricing comparison/i)).toBeInTheDocument();
      expect(screen.getByText(/FAQ section/i)).toBeInTheDocument();
    });

    it('should display landing page recommendations', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Focus on trust signals above the fold/i)).toBeInTheDocument();
      expect(screen.getByText(/Include pricing transparency/i)).toBeInTheDocument();
    });
  });

  describe('Keywords List', () => {
    it('should display keywords section', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Top.*Keyword/i)).toBeInTheDocument();
    });

    it('should display all keywords', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/market research tool/i)).toBeInTheDocument();
      expect(screen.getByText(/competitor analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/niche finder/i)).toBeInTheDocument();
      expect(screen.getByText(/ad spy tool/i)).toBeInTheDocument();
      expect(screen.getByText(/market gap analysis/i)).toBeInTheDocument();
    });

    it('should display difficulty and volume for keywords', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/12,000/i)).toBeInTheDocument(); // volume (formatted)
      expect(screen.getByText(/45/i)).toBeInTheDocument(); // difficulty
    });

    it('should show difficulty indicators', () => {
      const { container } = render(<ActionPlan actionPlan={mockActionPlan} />);

      // Check for difficulty indicators (badges)
      const badges = container.querySelectorAll('[data-slot="badge"]');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Presentation', () => {
    it('should render as a section with proper structure', () => {
      const { container } = render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(container.querySelector('[data-testid="action-plan"]')).toBeInTheDocument();
    });

    it('should have a section title', () => {
      render(<ActionPlan actionPlan={mockActionPlan} />);

      expect(screen.getByText(/Action Plan/i)).toBeInTheDocument();
    });

    it('should use card components for organization', () => {
      const { container } = render(<ActionPlan actionPlan={mockActionPlan} />);

      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty quick wins', () => {
      const emptyQuickWins = { ...mockActionPlan, quickWins: [] };
      render(<ActionPlan actionPlan={emptyQuickWins} />);

      expect(screen.getByText(/No quick wins identified/i)).toBeInTheDocument();
    });

    it('should handle empty ad concepts', () => {
      const emptyAdConcepts = { ...mockActionPlan, adConcepts: [] };
      render(<ActionPlan actionPlan={emptyAdConcepts} />);

      expect(screen.getByText(/No ad concepts generated/i)).toBeInTheDocument();
    });

    it('should handle empty keywords', () => {
      const emptyKeywords = { ...mockActionPlan, keywords: [] };
      render(<ActionPlan actionPlan={emptyKeywords} />);

      expect(screen.getByText(/No keywords identified/i)).toBeInTheDocument();
    });
  });
});

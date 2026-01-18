/**
 * Buildability Assessment Component Tests
 *
 * Tests for the Buildability Assessment report section (RG-011)
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BuildabilityAssessment } from '@/components/reports/BuildabilityAssessment';

describe('BuildabilityAssessment', () => {
  const mockBuildability = {
    implementationDifficulty: 65,
    buildDifficulty: 70,
    distributionDifficulty: 50,
    timeToMVP: 'M' as const,
    humanTouchLevel: 'medium' as const,
    autonomousSuitability: 'high' as const,
    riskFlags: [
      {
        type: 'compliance',
        severity: 'medium',
        description: 'GDPR compliance required for EU users',
      },
      {
        type: 'platform_policy',
        severity: 'low',
        description: 'App Store review guidelines may affect features',
      },
    ],
  };

  describe('Difficulty Scores', () => {
    it('should display implementation difficulty score', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      const implementationElements = screen.getAllByText(/Implementation Difficulty/i);
      expect(implementationElements.length).toBeGreaterThan(0);
      expect(screen.getByText('65')).toBeInTheDocument();
    });

    it('should display build difficulty score', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      expect(screen.getByText(/Build Difficulty/i)).toBeInTheDocument();
      expect(screen.getByText('70')).toBeInTheDocument();
    });

    it('should display distribution difficulty score', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      expect(screen.getByText(/Distribution Difficulty/i)).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should show visual indicators for difficulty scores', () => {
      const { container } = render(<BuildabilityAssessment buildability={mockBuildability} />);

      const progressBars = container.querySelectorAll('[role="progressbar"]');
      expect(progressBars.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('MVP Time Estimate', () => {
    it('should display time-to-MVP estimate', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      expect(screen.getByText(/Time to MVP/i)).toBeInTheDocument();
      const mediumElements = screen.getAllByText(/Medium/i);
      expect(mediumElements.length).toBeGreaterThan(0);
    });

    it('should display S (small) estimate', () => {
      const smallBuildability = { ...mockBuildability, timeToMVP: 'S' as const };
      render(<BuildabilityAssessment buildability={smallBuildability} />);

      expect(screen.getByText(/Small/i)).toBeInTheDocument();
    });

    it('should display M (medium) estimate', () => {
      const mediumBuildability = { ...mockBuildability, timeToMVP: 'M' as const };
      render(<BuildabilityAssessment buildability={mediumBuildability} />);

      const mediumElements = screen.getAllByText(/Medium/i);
      expect(mediumElements.length).toBeGreaterThan(0);
    });

    it('should display L (large) estimate', () => {
      const largeBuildability = { ...mockBuildability, timeToMVP: 'L' as const };
      render(<BuildabilityAssessment buildability={largeBuildability} />);

      expect(screen.getByText(/Large/i)).toBeInTheDocument();
    });
  });

  describe('Human Touch Level', () => {
    it('should display human touch level', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      expect(screen.getByText(/Human Touch/i)).toBeInTheDocument();
      const mediumElements = screen.getAllByText(/Medium/i);
      expect(mediumElements.length).toBeGreaterThan(0);
    });

    it('should display high touch level', () => {
      const highTouch = { ...mockBuildability, humanTouchLevel: 'high' as const };
      render(<BuildabilityAssessment buildability={highTouch} />);

      const highElements = screen.getAllByText(/High/i);
      expect(highElements.length).toBeGreaterThan(0);
    });

    it('should display low touch level', () => {
      const lowTouch = { ...mockBuildability, humanTouchLevel: 'low' as const };
      render(<BuildabilityAssessment buildability={lowTouch} />);

      const lowElements = screen.getAllByText(/Low/i);
      expect(lowElements.length).toBeGreaterThan(0);
    });
  });

  describe('Autonomous Suitability', () => {
    it('should display autonomous agent suitability', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      expect(screen.getByText(/Autonomous.*Suitability/i)).toBeInTheDocument();
      const highElements = screen.getAllByText(/High/i);
      expect(highElements.length).toBeGreaterThan(0);
    });

    it('should display medium suitability', () => {
      const mediumAuto = { ...mockBuildability, autonomousSuitability: 'medium' as const };
      render(<BuildabilityAssessment buildability={mediumAuto} />);

      const mediumElements = screen.getAllByText(/Medium/i);
      expect(mediumElements.length).toBeGreaterThan(0);
    });

    it('should display low suitability', () => {
      const lowAuto = { ...mockBuildability, autonomousSuitability: 'low' as const };
      render(<BuildabilityAssessment buildability={lowAuto} />);

      const lowElements = screen.getAllByText(/Low/i);
      expect(lowElements.length).toBeGreaterThan(0);
    });
  });

  describe('Risk Flags', () => {
    it('should display risk flags section', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      expect(screen.getByText(/Risk Flags/i)).toBeInTheDocument();
    });

    it('should display each risk flag', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      expect(screen.getByText(/GDPR compliance required/i)).toBeInTheDocument();
      expect(screen.getByText(/App Store review guidelines/i)).toBeInTheDocument();
    });

    it('should display risk severity badges', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      const mediumElements = screen.getAllByText(/medium/i);
      expect(mediumElements.length).toBeGreaterThan(0);
      const lowElements = screen.getAllByText(/low/i);
      expect(lowElements.length).toBeGreaterThan(0);
    });

    it('should display risk types', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      const complianceElements = screen.getAllByText(/compliance/i);
      expect(complianceElements.length).toBeGreaterThan(0);
      const policyElements = screen.getAllByText(/platform.*policy/i);
      expect(policyElements.length).toBeGreaterThan(0);
    });

    it('should handle no risk flags', () => {
      const noRisks = { ...mockBuildability, riskFlags: [] };
      render(<BuildabilityAssessment buildability={noRisks} />);

      expect(screen.getByText(/No risk flags identified/i)).toBeInTheDocument();
    });

    it('should display high severity risks prominently', () => {
      const highRisk = {
        ...mockBuildability,
        riskFlags: [
          {
            type: 'legal',
            severity: 'high' as const,
            description: 'Potential patent infringement',
          },
        ],
      };
      render(<BuildabilityAssessment buildability={highRisk} />);

      const highElements = screen.getAllByText(/high/i);
      expect(highElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/Potential patent infringement/i)).toBeInTheDocument();
    });
  });

  describe('Visual Presentation', () => {
    it('should render as a section with proper structure', () => {
      const { container } = render(<BuildabilityAssessment buildability={mockBuildability} />);

      expect(container.querySelector('[data-testid="buildability-assessment"]')).toBeInTheDocument();
    });

    it('should have a section title', () => {
      render(<BuildabilityAssessment buildability={mockBuildability} />);

      expect(screen.getByText(/Buildability Assessment/i)).toBeInTheDocument();
    });

    it('should use card components for organization', () => {
      const { container } = render(<BuildabilityAssessment buildability={mockBuildability} />);

      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero difficulty scores', () => {
      const zeroDifficulty = {
        ...mockBuildability,
        implementationDifficulty: 0,
        buildDifficulty: 0,
        distributionDifficulty: 0,
      };

      render(<BuildabilityAssessment buildability={zeroDifficulty} />);

      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });

    it('should handle maximum difficulty scores', () => {
      const maxDifficulty = {
        ...mockBuildability,
        implementationDifficulty: 100,
        buildDifficulty: 100,
        distributionDifficulty: 100,
      };

      render(<BuildabilityAssessment buildability={maxDifficulty} />);

      const hundredElements = screen.getAllByText('100');
      expect(hundredElements.length).toBeGreaterThan(0);
    });
  });
});

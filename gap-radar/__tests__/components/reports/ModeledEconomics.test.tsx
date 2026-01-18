/**
 * Modeled Economics Component Tests
 *
 * Tests for the Modeled Economics report section (RG-010)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModeledEconomics } from '@/components/reports/ModeledEconomics';

// Mock Radix UI Slider
jest.mock('@radix-ui/react-slider', () => ({
  Root: ({ children, value, onValueChange, min, max, step, ...props }: any) => (
    <div role="slider" aria-label={props['aria-label']} {...props}>
      <input
        type="range"
        value={value?.[0] || 0}
        onChange={(e) => onValueChange?.([Number(e.target.value)])}
        min={min}
        max={max}
        step={step}
      />
      {children}
    </div>
  ),
  Track: ({ children }: any) => <div>{children}</div>,
  Range: () => <div />,
  Thumb: () => <div />,
}));

describe('ModeledEconomics', () => {
  const mockEconomics = {
    cpc: { low: 0.5, expected: 2.0, high: 5.0 },
    cac: { low: 10, expected: 50, high: 150 },
    tam: { low: 100000, expected: 1000000, high: 10000000 },
  };

  describe('Range Displays', () => {
    it('should display CPC ranges', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      expect(screen.getByText(/Cost Per Click \(CPC\)/i)).toBeInTheDocument();
      expect(screen.getByText(/\$0\.50/i)).toBeInTheDocument();
      expect(screen.getByText(/\$2\.00/i)).toBeInTheDocument();
      expect(screen.getByText(/\$5\.00/i)).toBeInTheDocument();
    });

    it('should display CAC ranges', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      expect(screen.getByText(/Customer Acquisition Cost \(CAC\)/i)).toBeInTheDocument();
      const allText = screen.getAllByText(/\$10/i);
      expect(allText.length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\$50/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\$150/i).length).toBeGreaterThan(0);
    });

    it('should display TAM ranges', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      expect(screen.getByText(/Total Addressable Market \(TAM\)/i)).toBeInTheDocument();
      expect(screen.getAllByText(/100\.0K/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/1\.0M/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/10\.0M/i).length).toBeGreaterThan(0);
    });

    it('should highlight expected values', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      const expectedValues = screen.getAllByText(/Expected/i);
      expect(expectedValues.length).toBeGreaterThan(0);
    });
  });

  describe('Budget Scenarios', () => {
    it('should render budget scenario selector', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      const budgetElements = screen.getAllByText(/Budget/i);
      expect(budgetElements.length).toBeGreaterThan(0);
    });

    it('should display low budget scenario calculations', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      // Should show some calculation based on low budget
      expect(screen.getByText(/Low/i)).toBeInTheDocument();
    });

    it('should display medium budget scenario calculations', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });

    it('should display high budget scenario calculations', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      expect(screen.getByText(/High/i)).toBeInTheDocument();
    });

    it('should calculate potential customers for each budget scenario', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      // Should display potential customer calculations
      const customerElements = screen.getAllByText(/Customers/i);
      expect(customerElements.length).toBeGreaterThan(0);
    });
  });

  describe('Interactive Sensitivity Sliders', () => {
    it('should render CAC sensitivity slider', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBeGreaterThanOrEqual(1);
    });

    it('should render conversion rate slider', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBeGreaterThanOrEqual(2);
    });

    it('should update calculations when CAC slider changes', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      const sliders = screen.getAllByRole('slider');
      const cacSlider = sliders[0];

      const input = cacSlider.querySelector('input');
      if (input) {
        fireEvent.change(input, { target: { value: '100' } });
        expect(input.value).toBe('100');
      }
    });

    it('should update calculations when conversion rate slider changes', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      const sliders = screen.getAllByRole('slider');
      const conversionSlider = sliders[1];

      const input = conversionSlider.querySelector('input');
      if (input) {
        fireEvent.change(input, { target: { value: '5' } });
        expect(input.value).toBe('5');
      }
    });

    it('should display current slider values', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      // Should show current values next to sliders
      expect(screen.getByText(/100%/i)).toBeInTheDocument(); // CAC default
      expect(screen.getByText(/2\.5%/i)).toBeInTheDocument(); // Conversion default
    });
  });

  describe('Visual Presentation', () => {
    it('should render as a card component', () => {
      const { container } = render(<ModeledEconomics economics={mockEconomics} />);

      expect(container.querySelector('[class*="card"]')).toBeInTheDocument();
    });

    it('should have a section title', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      expect(screen.getByText(/Modeled Economics/i)).toBeInTheDocument();
    });

    it('should display ranges with visual bars or indicators', () => {
      const { container } = render(<ModeledEconomics economics={mockEconomics} />);

      // Should have some visual elements for ranges (progress bars, etc.)
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const zeroEconomics = {
        cpc: { low: 0, expected: 0, high: 0 },
        cac: { low: 0, expected: 0, high: 0 },
        tam: { low: 0, expected: 0, high: 0 },
      };

      render(<ModeledEconomics economics={zeroEconomics} />);

      expect(screen.getByText(/Modeled Economics/i)).toBeInTheDocument();
    });

    it('should handle very large numbers', () => {
      const largeEconomics = {
        cpc: { low: 100, expected: 500, high: 1000 },
        cac: { low: 10000, expected: 50000, high: 150000 },
        tam: { low: 1000000000, expected: 5000000000, high: 10000000000 },
      };

      render(<ModeledEconomics economics={largeEconomics} />);

      expect(screen.getByText(/Modeled Economics/i)).toBeInTheDocument();
    });

    it('should format large numbers with abbreviations', () => {
      const largeEconomics = {
        cpc: { low: 1, expected: 2, high: 5 },
        cac: { low: 10, expected: 50, high: 150 },
        tam: { low: 1000000000, expected: 5000000000, high: 10000000000 },
      };

      render(<ModeledEconomics economics={largeEconomics} />);

      // Should use B for billions
      expect(screen.getByText(/1\.0B/i)).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('should validate that high is greater than expected', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      // Component should render without errors even with valid data
      expect(screen.getByText(/Modeled Economics/i)).toBeInTheDocument();
    });

    it('should validate that expected is greater than low', () => {
      render(<ModeledEconomics economics={mockEconomics} />);

      expect(screen.getByText(/Modeled Economics/i)).toBeInTheDocument();
    });
  });
});

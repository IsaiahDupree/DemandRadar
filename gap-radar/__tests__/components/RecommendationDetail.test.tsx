/**
 * Tests for Recommendation Detail Modal
 *
 * Validates BUILD-006 acceptance criteria:
 * 1. All fields shown
 * 2. Sample ad copy
 * 3. Export option
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecommendationDetail } from '@/components/RecommendationDetail';
import { BuildRecommendation } from '@/types';

const mockRecommendation: BuildRecommendation = {
  id: "rec-1",
  runId: "run-123",
  nicheId: "niche-456",
  userId: "user-789",
  productIdea: "Chrome Extension for Competitor Tracking",
  productType: "chrome_extension",
  oneLiner: "One-click competitor tracking for busy founders",
  targetAudience: "Solo founders and small marketing teams",
  painPoints: [
    { text: "Manual competitor tracking is time-consuming", source: "r/startups" },
    { text: "Need to check competitor sites daily", source: "r/entrepreneur" },
  ],
  competitorGaps: [
    { competitor: "CompetitorX", gap: "No automatic price tracking" },
    { competitor: "TrackerPro", gap: "Poor Chrome extension UX" },
  ],
  searchQueries: [
    { query: "competitor tracking tool", volume: 1200 },
    { query: "automatic competitor monitoring", volume: 850 },
  ],
  recommendedHooks: [
    "Stop stalking competitors manually",
    "Know when competitors change pricing—instantly",
    "Your competitors are watching you. Are you watching them?",
  ],
  recommendedChannels: ["Google Ads", "Twitter/X", "YouTube"],
  sampleAdCopy: {
    headline: "Never miss a competitor move again",
    body: "Get instant alerts when competitors change pricing, launch features, or publish content. One-click install, works in the background.",
    cta: "Install Free Extension →",
  },
  landingPageAngle: "Time-saving automation for competitive intelligence",
  buildComplexity: "weekend",
  techStackSuggestion: ["React", "Chrome APIs", "Supabase"],
  estimatedTimeToMvp: "2-3 days",
  estimatedCacRange: "$5-15",
  confidenceScore: 87,
  reasoning: "Strong signal from Reddit posts and search volume growth",
  supportingSignals: 12,
  status: "new",
  createdAt: new Date("2026-01-20T00:00:00Z"),
  updatedAt: new Date("2026-01-20T00:00:00Z"),
};

describe("RecommendationDetail", () => {
  describe("Modal Rendering", () => {
    it("should render when open", () => {
      render(
        <RecommendationDetail
          recommendation={mockRecommendation}
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByText("Chrome Extension for Competitor Tracking")).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      const { container } = render(
        <RecommendationDetail
          recommendation={mockRecommendation}
          isOpen={false}
          onClose={() => {}}
        />
      );

      // Dialog should not be visible
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it("should call onClose when close button clicked", () => {
      const onClose = jest.fn();

      render(
        <RecommendationDetail
          recommendation={mockRecommendation}
          isOpen={true}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("All Fields Shown (Acceptance #1)", () => {
    beforeEach(() => {
      render(
        <RecommendationDetail
          recommendation={mockRecommendation}
          isOpen={true}
          onClose={() => {}}
        />
      );
    });

    it("should show product idea title", () => {
      expect(screen.getByText("Chrome Extension for Competitor Tracking")).toBeInTheDocument();
    });

    it("should show one-liner", () => {
      expect(screen.getByText(/One-click competitor tracking for busy founders/i)).toBeInTheDocument();
    });

    it("should show target audience section", () => {
      expect(screen.getByText(/Target Audience/i)).toBeInTheDocument();
      expect(screen.getByText("Solo founders and small marketing teams")).toBeInTheDocument();
    });

    it("should show why now section with reasoning", () => {
      expect(screen.getByText(/Why Now/i)).toBeInTheDocument();
      expect(screen.getByText(/Strong signal from Reddit posts/i)).toBeInTheDocument();
    });

    it("should show pain points section", () => {
      expect(screen.getByText(/Pain Points/i)).toBeInTheDocument();
      expect(screen.getByText(/Manual competitor tracking is time-consuming/i)).toBeInTheDocument();
      expect(screen.getByText(/Need to check competitor sites daily/i)).toBeInTheDocument();
    });

    it("should show competitor gaps section", () => {
      expect(screen.getByText(/Competitor Gaps/i)).toBeInTheDocument();
      expect(screen.getByText(/No automatic price tracking/i)).toBeInTheDocument();
    });

    it("should show search queries section", () => {
      expect(screen.getByText(/Search Queries/i)).toBeInTheDocument();
      expect(screen.getByText(/competitor tracking tool/i)).toBeInTheDocument();
    });

    it("should show build estimate section", () => {
      expect(screen.getByText(/Build Estimate/i)).toBeInTheDocument();
      expect(screen.getByText(/weekend project/i)).toBeInTheDocument();
      expect(screen.getByText(/2-3 days/i)).toBeInTheDocument();
    });

    it("should show tech stack", () => {
      expect(screen.getByText(/React/)).toBeInTheDocument();
      expect(screen.getByText(/Chrome APIs/)).toBeInTheDocument();
      expect(screen.getByText(/Supabase/)).toBeInTheDocument();
    });

    it("should show recommended hooks section", () => {
      expect(screen.getByText(/Recommended Hooks/i)).toBeInTheDocument();
      expect(screen.getByText(/Stop stalking competitors manually/i)).toBeInTheDocument();
      expect(screen.getByText(/Know when competitors change pricing/i)).toBeInTheDocument();
    });

    it("should show best channels section", () => {
      expect(screen.getByText(/Best Channels/i)).toBeInTheDocument();
      expect(screen.getByText(/Google Ads/i)).toBeInTheDocument();
      expect(screen.getByText(/Twitter\/X/i)).toBeInTheDocument();
      expect(screen.getByText(/YouTube/i)).toBeInTheDocument();
    });

    it("should show confidence score", () => {
      expect(screen.getByText(/87/)).toBeInTheDocument();
    });

    it("should show estimated CAC range", () => {
      expect(screen.getByText(/\$5-15/i)).toBeInTheDocument();
    });
  });

  describe("Sample Ad Copy (Acceptance #2)", () => {
    beforeEach(() => {
      render(
        <RecommendationDetail
          recommendation={mockRecommendation}
          isOpen={true}
          onClose={() => {}}
        />
      );
    });

    it("should show sample ad copy section", () => {
      expect(screen.getByText(/Sample Ad Copy/i)).toBeInTheDocument();
    });

    it("should show ad headline", () => {
      expect(screen.getByText("Never miss a competitor move again")).toBeInTheDocument();
    });

    it("should show ad body text", () => {
      expect(screen.getByText(/Get instant alerts when competitors change pricing/i)).toBeInTheDocument();
    });

    it("should show ad CTA", () => {
      expect(screen.getByText(/Install Free Extension/i)).toBeInTheDocument();
    });

    it("should render ad copy in a visually distinct card", () => {
      const adCopyText = screen.getByText("Never miss a competitor move again");
      // Find the parent container with border styling
      let card = adCopyText.parentElement;
      while (card && !card.className.includes('border')) {
        card = card.parentElement;
      }
      expect(card?.className).toContain('border');
    });
  });

  describe("Export Option (Acceptance #3)", () => {
    it("should show export brief button", () => {
      render(
        <RecommendationDetail
          recommendation={mockRecommendation}
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/Export Brief/i)).toBeInTheDocument();
    });

    it("should call export handler when export button clicked", () => {
      const onExport = jest.fn();
      render(
        <RecommendationDetail
          recommendation={mockRecommendation}
          isOpen={true}
          onClose={() => {}}
          onExport={onExport}
        />
      );

      const exportButton = screen.getByText(/Export Brief/i);
      exportButton.click();

      expect(onExport).toHaveBeenCalledWith(mockRecommendation);
    });
  });

  describe("Action Buttons", () => {
    it("should show start building button", () => {
      render(
        <RecommendationDetail
          recommendation={mockRecommendation}
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/Start Building/i)).toBeInTheDocument();
    });

    it("should show save to queue button", () => {
      render(
        <RecommendationDetail
          recommendation={mockRecommendation}
          isOpen={true}
          onClose={() => {}}
        />
      );

      expect(screen.getByText(/Save to Queue/i)).toBeInTheDocument();
    });
  });

  describe("Null/Optional Fields", () => {
    it("should handle recommendation with null optional fields", () => {
      const minimalRecommendation: BuildRecommendation = {
        ...mockRecommendation,
        oneLiner: null,
        painPoints: null,
        competitorGaps: null,
        searchQueries: null,
        recommendedHooks: null,
        recommendedChannels: null,
        sampleAdCopy: null,
        techStackSuggestion: null,
        landingPageAngle: null,
        reasoning: null,
      };

      render(
        <RecommendationDetail
          recommendation={minimalRecommendation}
          isOpen={true}
          onClose={() => {}}
        />
      );

      // Should still render product idea
      expect(screen.getByText("Chrome Extension for Competitor Tracking")).toBeInTheDocument();
    });
  });
});

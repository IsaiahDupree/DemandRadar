/**
 * Tests for Demand Brief Email Template (BRIEF-008)
 *
 * Acceptance Criteria:
 * 1. Score section
 * 2. What Changed section
 * 3. Plays section
 * 4. Copy section
 */

import React from "react";
import { render } from "@testing-library/react";
import { DemandBriefEmail } from "@/lib/email/templates/demand-brief";
import type { DemandSnapshot } from "@/lib/email/send-brief";

const mockSnapshot: DemandSnapshot = {
  id: "snapshot-1",
  niche_id: "niche-1",
  offering_name: "Logo Maker Pro",
  week_start: "2026-01-13",
  demand_score: 75,
  demand_score_change: 5,
  opportunity_score: 68,
  message_market_fit_score: 72,
  trend: "up",
  why_score_changed: [
    "25 advertisers active (high competition)",
    "Mentions increased 20% this week",
    '"too expensive" complaints trending',
  ],
  ad_signals: {
    advertiserCount: 25,
    topAngles: ["Fast rendering", "Easy to use", "No watermarks"],
    topOffers: ["Free trial", "50% off", "Money-back guarantee"],
    avgLongevityDays: 45,
  },
  search_signals: {
    buyerIntentKeywords: [
      { keyword: "best logo maker", volume: 5000 },
      { keyword: "canva alternative", volume: 3000 },
      { keyword: "logo pricing", volume: 2000 },
    ],
  },
  forum_signals: {
    complaints: [
      { text: "too expensive", frequency: 45 },
      { text: "slow rendering", frequency: 30 },
    ],
    desires: [
      { text: "batch processing", frequency: 60 },
      { text: "custom fonts", frequency: 40 },
    ],
  },
  competitor_signals: {
    activeCompetitors: 18,
  },
  plays: [
    {
      type: "product",
      action: "Add batch processing feature",
      evidence: "60 users requested batch processing",
      priority: "high",
    },
    {
      type: "offer",
      action: "Test free trial offer",
      evidence: "35 purchase intent signals detected",
      priority: "medium",
    },
    {
      type: "distribution",
      action: "Test winning angle: Remove watermarks instantly",
      evidence: "25 advertisers using similar approach",
      priority: "high",
    },
  ],
  ad_hooks: [
    "Remove watermarks instantly",
    "No quality loss exports",
    "Batch processing included",
    "Custom fonts for every brand",
    "The fastest logo maker online",
  ],
  subject_lines: [
    "Your Logo Maker Pro weekly update",
    "Demand is up 5%",
    "New opportunities this week",
    "What changed in your market",
    "This week's winning strategies",
  ],
  landing_copy:
    "Tired of expensive logo tools? You're not alone. Logo Maker Pro gives you professional results without the premium price. Start your free trial today.",
  created_at: "2026-01-18T00:00:00Z",
};

describe("Demand Brief Email Template", () => {
  describe("Score Section", () => {
    it("should render demand score", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("75"); // demand_score
      expect(html).toContain("DEMAND SCORE");
    });

    it("should render score change with trend", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("+5"); // demand_score_change
      expect(html).toContain("▲"); // up trend emoji
    });

    it("should render opportunity and message fit scores", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("68"); // opportunity_score
      expect(html).toContain("72"); // message_market_fit_score
      expect(html).toContain("Opportunity");
      expect(html).toContain("Message Fit");
    });

    it("should render why score changed reasons", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("25 advertisers active");
      expect(html).toContain("Mentions increased 20%");
      expect(html).toContain('"too expensive" complaints trending');
    });
  });

  describe("What Changed Section", () => {
    it("should render ad signals", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("25 advertisers active");
      expect(html).toContain("Fast rendering");
      expect(html).toContain("Easy to use");
    });

    it("should render search signals", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("best logo maker");
      expect(html).toContain("canva alternative");
    });

    it("should render forum signals", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("too expensive");
      expect(html).toContain("slow rendering");
      expect(html).toContain("batch processing");
      expect(html).toContain("custom fonts");
    });

    it("should render competitor signals", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("18 active competitors");
    });
  });

  describe("Plays Section", () => {
    it("should render all 3 plays", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("Add batch processing feature");
      expect(html).toContain("Test free trial offer");
      expect(html).toContain("Test winning angle: Remove watermarks instantly");
    });

    it("should render play types", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("PRODUCT PLAY");
      expect(html).toContain("OFFER PLAY");
      expect(html).toContain("DISTRIBUTION PLAY");
    });

    it("should render play evidence", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("60 users requested batch processing");
      expect(html).toContain("35 purchase intent signals detected");
      expect(html).toContain("25 advertisers using similar approach");
    });

    it("should show high priority badge for high priority plays", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("HIGH PRIORITY");
    });
  });

  describe("Copy Section", () => {
    it("should render ad hooks", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("Remove watermarks instantly");
      expect(html).toContain("No quality loss exports");
      expect(html).toContain("Batch processing included");
      expect(html).toContain("AD HOOKS");
    });

    it("should render subject lines", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("Your Logo Maker Pro weekly update");
      expect(html).toContain("Demand is up 5%");
      expect(html).toContain("SUBJECT LINES");
    });

    it("should render landing page copy", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("Tired of expensive logo tools?");
      expect(html).toContain("LANDING PAGE PARAGRAPH");
    });
  });

  describe("Email Structure", () => {
    it("should include header with logo", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("DemandRadar");
      expect(html).toContain("Your Weekly Demand Brief");
    });

    it("should include greeting", () => {
      const { container } = render(
        <DemandBriefEmail snapshot={mockSnapshot} recipientName="John" />
      );
      const html = container.innerHTML;

      expect(html).toContain("Hi John,");
    });

    it("should default to 'Hi there' without recipient name", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("Hi there,");
    });

    it("should include offering name in greeting", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("Logo Maker Pro");
    });

    it("should include CTA button", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("View Full Dashboard");
    });

    it("should include footer with links", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("Manage your niches");
      expect(html).toContain("Settings");
    });
  });

  describe("Trend Indicators", () => {
    it("should show up trend emoji and green color", () => {
      const { container } = render(<DemandBriefEmail snapshot={mockSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("▲");
      // React converts hex #10b981 to rgb(16, 185, 129)
      expect(html).toContain("rgb(16, 185, 129)"); // green
    });

    it("should show down trend emoji and red color", () => {
      const downSnapshot = { ...mockSnapshot, trend: "down" as const, demand_score_change: -5 };
      const { container } = render(<DemandBriefEmail snapshot={downSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("▼");
      // React converts hex #ef4444 to rgb(239, 68, 68)
      expect(html).toContain("rgb(239, 68, 68)"); // red
    });

    it("should show stable trend emoji and gray color", () => {
      const stableSnapshot = { ...mockSnapshot, trend: "stable" as const, demand_score_change: 0 };
      const { container } = render(<DemandBriefEmail snapshot={stableSnapshot} />);
      const html = container.innerHTML;

      expect(html).toContain("→");
      // React converts hex #6b7280 to rgb(107, 114, 128)
      expect(html).toContain("rgb(107, 114, 128)"); // gray
    });
  });
});

/**
 * Tests for Demand Brief Email Service (BRIEF-003)
 *
 * Acceptance Criteria:
 * - Email renders correctly
 * - Demand score shown
 * - What changed section
 * - Copy-pasteable hooks
 */

// Mock the resend module
const mockSendDemandBriefEmail = jest.fn();
jest.mock('@/lib/email/resend', () => ({
  sendDemandBriefEmail: mockSendDemandBriefEmail,
}));

import { generateAndSendDemandBrief } from '@/lib/email/demand-brief';
import type { DemandSnapshot } from '@/lib/email/resend';

// Mock Supabase client
const mockSupabaseQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => mockSupabaseQuery),
  })),
}));

describe('Demand Brief Email Service', () => {
  const mockSnapshot: DemandSnapshot = {
    id: 'snapshot-123',
    niche_id: 'niche-456',
    offering_name: 'AI Content Tool',
    week_start: '2026-01-13',
    demand_score: 78,
    demand_score_change: 5,
    opportunity_score: 82,
    message_market_fit_score: 74,
    trend: 'up',
    ad_signals: {
      advertiserCount: 15,
      topAngles: ['Speed & Efficiency', 'Better Quality', 'Cost Savings'],
      newAdvertisers: 3,
    },
    search_signals: {
      volumeChange: 12,
      topKeywords: ['ai content generator', 'ai writing tool'],
    },
    ugc_signals: {
      mentionCount: 45,
      sentiment: 'positive',
    },
    forum_signals: {
      postCount: 23,
      topPains: ['Too expensive', 'Limited features'],
    },
    competitor_signals: {
      activeCompetitors: 8,
      marketLeaders: ['Jasper', 'Copy.ai'],
    },
    plays: [
      {
        type: 'positioning',
        title: 'Lead with Speed',
        evidence: '3 new ads emphasizing "10x faster"',
        priority: 'high',
      },
      {
        type: 'offer',
        title: 'Test Free Trial Extension',
        evidence: 'Users asking for longer trials in r/contentmarketing',
        priority: 'medium',
      },
      {
        type: 'messaging',
        title: 'Address Quality Concerns',
        evidence: '15 mentions of "needs human editing"',
        priority: 'high',
      },
    ],
    ad_hooks: [
      'Create content 10x faster with AI',
      'Stop wasting hours on content creation',
      'The AI writing tool that sounds human',
    ],
    subject_lines: [
      'Your AI content assistant is here',
      'Write better content in minutes',
      'Finally, AI that writes like you',
    ],
    landing_copy:
      'Transform your content creation workflow with AI-powered writing that sounds human.',
    why_score_changed: [
      '3 new advertisers entered the market',
      'Search volume increased 12%',
      'Positive sentiment in UGC mentions',
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAndSendDemandBrief', () => {
    it('should fetch snapshot and send email successfully', async () => {
      // Mock successful snapshot fetch
      mockSupabaseQuery.single.mockResolvedValue({
        data: mockSnapshot,
        error: null,
      });

      // Mock successful email send
      mockSendDemandBriefEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
        sentAt: new Date(),
      });

      const result = await generateAndSendDemandBrief({
        userId: 'user-123',
        nicheId: 'niche-456',
        recipientEmail: 'test@example.com',
        recipientName: 'John Doe',
      });

      expect(result.success).toBe(true);
      expect(result.emailId).toBe('email-123');
      expect(result.snapshot).toBeDefined();
      expect(mockSendDemandBriefEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        name: 'John Doe',
        snapshot: expect.objectContaining({
          demand_score: 78,
          offering_name: 'AI Content Tool',
        }),
      });
    });

    it('should show demand score in snapshot', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: mockSnapshot,
        error: null,
      });

      mockSendDemandBriefEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
      });

      const result = await generateAndSendDemandBrief({
        userId: 'user-123',
        nicheId: 'niche-456',
        recipientEmail: 'test@example.com',
      });

      expect(result.snapshot?.demand_score).toBe(78);
      expect(result.snapshot?.demand_score_change).toBe(5);
      expect(result.snapshot?.trend).toBe('up');
    });

    it('should include what changed section data', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: mockSnapshot,
        error: null,
      });

      mockSendDemandBriefEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
      });

      const result = await generateAndSendDemandBrief({
        userId: 'user-123',
        nicheId: 'niche-456',
        recipientEmail: 'test@example.com',
      });

      expect(result.snapshot?.why_score_changed).toHaveLength(3);
      expect(result.snapshot?.ad_signals).toBeDefined();
      expect(result.snapshot?.search_signals).toBeDefined();
      expect(result.snapshot?.forum_signals).toBeDefined();
    });

    it('should include copy-pasteable hooks', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: mockSnapshot,
        error: null,
      });

      mockSendDemandBriefEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
      });

      const result = await generateAndSendDemandBrief({
        userId: 'user-123',
        nicheId: 'niche-456',
        recipientEmail: 'test@example.com',
      });

      expect(result.snapshot?.ad_hooks).toHaveLength(3);
      expect(result.snapshot?.subject_lines).toHaveLength(3);
      expect(result.snapshot?.landing_copy).toBeDefined();
      expect(result.snapshot?.ad_hooks[0]).toContain('Create content');
    });

    it('should handle missing snapshot gracefully', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await generateAndSendDemandBrief({
        userId: 'user-123',
        nicheId: 'niche-456',
        recipientEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No demand snapshot found');
      expect(mockSendDemandBriefEmail).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await generateAndSendDemandBrief({
        userId: 'user-123',
        nicheId: 'niche-456',
        recipientEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No demand snapshot found');
    });

    it('should handle email send failures', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: mockSnapshot,
        error: null,
      });

      mockSendDemandBriefEmail.mockResolvedValue({
        success: false,
        error: 'Failed to send email',
      });

      const result = await generateAndSendDemandBrief({
        userId: 'user-123',
        nicheId: 'niche-456',
        recipientEmail: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to send');
    });

    it('should work without recipient name', async () => {
      mockSupabaseQuery.single.mockResolvedValue({
        data: mockSnapshot,
        error: null,
      });

      mockSendDemandBriefEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
      });

      const result = await generateAndSendDemandBrief({
        userId: 'user-123',
        nicheId: 'niche-456',
        recipientEmail: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(mockSendDemandBriefEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        name: undefined,
        snapshot: expect.any(Object),
      });
    });
  });
});

/**
 * Discord Notifications Tests
 *
 * Tests for INTEG-002: Discord Notifications feature
 * Ensures run completion and gap alerts can be sent to Discord
 */

import { sendDiscordNotification, formatRunCompletionEmbed, formatGapAlertEmbed } from '@/lib/integrations/discord';

// Mock fetch for Discord webhook calls
global.fetch = jest.fn();

describe('Discord Notifications', () => {
  const mockWebhookUrl = 'https://discord.com/api/webhooks/123456789/abcdefgh';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatRunCompletionEmbed', () => {
    it('should format run completion data as Discord embed', () => {
      const runData = {
        id: 'run-123',
        niche_query: 'AI productivity tools',
        status: 'complete',
        created_at: '2026-01-18T00:00:00Z',
        finished_at: '2026-01-18T00:10:00Z',
        opportunityScore: 75,
        confidence: 0.85,
        totalGaps: 12,
        totalAds: 145,
        totalMentions: 89,
      };

      const embed = formatRunCompletionEmbed(runData);

      expect(embed).toBeDefined();
      expect(embed.title).toContain('AI productivity tools');
      expect(embed.title).toContain('Complete');
      expect(embed.color).toBe(0x00ff00); // Green for success
      expect(embed.fields).toBeDefined();
      expect(embed.fields.length).toBeGreaterThan(0);

      // Check for key fields
      const scoreField = embed.fields.find((f: any) => f.name === 'Opportunity Score');
      expect(scoreField).toBeDefined();
      expect(scoreField.value).toContain('75');

      const confidenceField = embed.fields.find((f: any) => f.name === 'Confidence');
      expect(confidenceField).toBeDefined();
      expect(confidenceField.value).toContain('85%');
    });

    it('should use red color for failed runs', () => {
      const runData = {
        id: 'run-123',
        niche_query: 'Test niche',
        status: 'failed',
        created_at: '2026-01-18T00:00:00Z',
        error: 'API rate limit exceeded',
      };

      const embed = formatRunCompletionEmbed(runData);

      expect(embed.color).toBe(0xff0000); // Red for failure
      expect(embed.title).toContain('Failed');
    });
  });

  describe('formatGapAlertEmbed', () => {
    it('should format gap alert data as Discord embed', () => {
      const gapData = {
        id: 'gap-1',
        runId: 'run-123',
        nicheQuery: 'AI productivity tools',
        type: 'product',
        title: 'Mobile experience gap',
        problem: 'Users complain about poor mobile UX',
        recommendation: 'Build mobile-first alternative',
        score: 82,
        confidence: 0.75,
      };

      const embed = formatGapAlertEmbed(gapData);

      expect(embed).toBeDefined();
      expect(embed.title).toContain('Mobile experience gap');
      expect(embed.color).toBe(0xffa500); // Orange for alerts
      expect(embed.fields).toBeDefined();

      // Check for key fields
      const typeField = embed.fields.find((f: any) => f.name === 'Gap Type');
      expect(typeField).toBeDefined();
      expect(typeField.value).toBe('product');

      const scoreField = embed.fields.find((f: any) => f.name === 'Score');
      expect(scoreField).toBeDefined();
      expect(scoreField.value).toContain('82');
    });
  });

  describe('sendDiscordNotification', () => {
    it('should send notification to Discord webhook', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      });

      const embed = {
        title: 'Test Notification',
        description: 'Test description',
        color: 0x00ff00,
        fields: [],
      };

      const result = await sendDiscordNotification(mockWebhookUrl, embed);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        mockWebhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Test Notification'),
        })
      );
    });

    it('should throw error if webhook URL is missing', async () => {
      const embed = {
        title: 'Test',
        color: 0x00ff00,
        fields: [],
      };

      await expect(sendDiscordNotification('', embed)).rejects.toThrow('Discord webhook URL is required');
    });

    it('should handle Discord API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      const embed = {
        title: 'Test',
        color: 0x00ff00,
        fields: [],
      };

      await expect(sendDiscordNotification(mockWebhookUrl, embed)).rejects.toThrow('Failed to send Discord notification');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const embed = {
        title: 'Test',
        color: 0x00ff00,
        fields: [],
      };

      await expect(sendDiscordNotification(mockWebhookUrl, embed)).rejects.toThrow('Failed to send Discord notification');
    });

    it('should support custom username and avatar', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      });

      const embed = {
        title: 'Test',
        color: 0x00ff00,
        fields: [],
      };

      await sendDiscordNotification(mockWebhookUrl, embed, {
        username: 'GapRadar Bot',
        avatarUrl: 'https://example.com/avatar.png',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        mockWebhookUrl,
        expect.objectContaining({
          body: expect.stringContaining('GapRadar Bot'),
        })
      );
    });
  });
});

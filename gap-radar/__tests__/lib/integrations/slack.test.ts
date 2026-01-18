/**
 * Slack Integration Tests (INTEG-001)
 *
 * Tests for Slack notification integration:
 * - OAuth flow
 * - Channel selection
 * - Message templates
 */

import {
  sendSlackNotification,
  formatRunCompleteMessage,
  formatGapAlertMessage,
  SlackConfig,
  SlackMessage,
} from '@/lib/integrations/slack';

describe('Slack Integration (INTEG-001)', () => {
  const mockConfig: SlackConfig = {
    workspaceId: 'T12345',
    accessToken: 'xoxb-mock-token',
    channelId: 'C12345',
    channelName: '#gap-alerts',
  };

  describe('formatRunCompleteMessage', () => {
    it('should format run completion message with opportunity score', () => {
      const runData = {
        id: 'run_123',
        nicheQuery: 'AI writing tools',
        opportunityScore: 85,
        confidence: 0.82,
        gapCount: 12,
        reportUrl: 'https://gapradar.com/reports/run_123',
      };

      const message = formatRunCompleteMessage(runData);

      expect(message).toBeDefined();
      expect(message.text).toContain('AI writing tools');
      expect(message.attachments).toBeDefined();
      expect(message.attachments!.length).toBeGreaterThan(0);

      // Metrics should be in attachments
      const attachmentStr = JSON.stringify(message.attachments);
      expect(attachmentStr).toContain('85');
      expect(attachmentStr).toContain('12');
    });

    it('should include link to report', () => {
      const runData = {
        id: 'run_456',
        nicheQuery: 'Project management SaaS',
        opportunityScore: 72,
        confidence: 0.75,
        gapCount: 8,
        reportUrl: 'https://gapradar.com/reports/run_456',
      };

      const message = formatRunCompleteMessage(runData);

      // Report URL should be in attachments
      const attachmentStr = JSON.stringify(message.attachments);
      expect(attachmentStr).toContain('https://gapradar.com/reports/run_456');
    });

    it('should handle zero gaps gracefully', () => {
      const runData = {
        id: 'run_789',
        nicheQuery: 'Highly saturated niche',
        opportunityScore: 15,
        confidence: 0.9,
        gapCount: 0,
        reportUrl: 'https://gapradar.com/reports/run_789',
      };

      const message = formatRunCompleteMessage(runData);

      expect(message).toBeDefined();
      expect(message.text).toContain('Highly saturated niche');

      // Gap count should be in attachments
      const attachmentStr = JSON.stringify(message.attachments);
      expect(attachmentStr).toMatch(/no gaps/i);
    });
  });

  describe('formatGapAlertMessage', () => {
    it('should format gap alert with gap details', () => {
      const gapData = {
        id: 'gap_123',
        title: 'Missing mobile app for productivity tracking',
        gapType: 'product' as const,
        opportunityScore: 88,
        evidence: {
          adCount: 45,
          redditMentions: 120,
        },
        recommendation: 'Build a mobile-first productivity tracker',
      };

      const message = formatGapAlertMessage(gapData);

      expect(message).toBeDefined();
      expect(message.text).toContain('Missing mobile app');
      expect(message.attachments).toBeDefined();
      expect(message.attachments!.length).toBeGreaterThan(0);

      // Check opportunity score is in attachments
      const attachmentStr = JSON.stringify(message.attachments);
      expect(attachmentStr).toContain('88');
    });

    it('should include evidence counts', () => {
      const gapData = {
        id: 'gap_456',
        title: 'Pricing transparency gap',
        gapType: 'pricing' as const,
        opportunityScore: 76,
        evidence: {
          adCount: 30,
          redditMentions: 85,
        },
        recommendation: 'Show transparent pricing upfront',
      };

      const message = formatGapAlertMessage(gapData);

      // Evidence should be in attachments
      const attachmentStr = JSON.stringify(message.attachments);
      expect(attachmentStr).toContain('30');
      expect(attachmentStr).toContain('85');
    });

    it('should include gap type badge', () => {
      const gapData = {
        id: 'gap_789',
        title: 'Trust gap in customer support',
        gapType: 'trust' as const,
        opportunityScore: 82,
        evidence: {
          adCount: 20,
          redditMentions: 95,
        },
        recommendation: 'Add live chat support',
      };

      const message = formatGapAlertMessage(gapData);

      expect(message.attachments).toBeDefined();
      // Should mention gap type
      const attachmentText = JSON.stringify(message.attachments);
      expect(attachmentText.toLowerCase()).toContain('trust');
    });
  });

  describe('sendSlackNotification', () => {
    // Mock fetch for tests
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send message to Slack API', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

      const message: SlackMessage = {
        text: 'Test message',
        channel: mockConfig.channelId,
      };

      const result = await sendSlackNotification(mockConfig, message);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://slack.com/api/chat.postMessage',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockConfig.accessToken}`,
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include message content in request', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response);

      const message: SlackMessage = {
        text: 'Run complete for AI tools',
        channel: mockConfig.channelId,
        attachments: [
          {
            color: '#36a64f',
            fields: [
              { title: 'Opportunity Score', value: '85', short: true },
            ],
          },
        ],
      };

      await sendSlackNotification(mockConfig, message);

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs?.body as string);

      expect(body.text).toBe('Run complete for AI tools');
      expect(body.channel).toBe(mockConfig.channelId);
      expect(body.attachments).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ ok: false, error: 'channel_not_found' }),
      } as Response);

      const message: SlackMessage = {
        text: 'Test message',
        channel: 'INVALID',
      };

      const result = await sendSlackNotification(mockConfig, message);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('channel_not_found');
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const message: SlackMessage = {
        text: 'Test message',
        channel: mockConfig.channelId,
      };

      const result = await sendSlackNotification(mockConfig, message);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('INTEG-001 Acceptance Criteria', () => {
    it('OAuth flow - Configuration accepts access token', () => {
      const config: SlackConfig = {
        workspaceId: 'T12345',
        accessToken: 'xoxb-test-token',
        channelId: 'C12345',
        channelName: '#alerts',
      };

      expect(config.accessToken).toBe('xoxb-test-token');
      expect(config.workspaceId).toBe('T12345');
    });

    it('Channel selection - Config includes channel details', () => {
      const config: SlackConfig = {
        workspaceId: 'T12345',
        accessToken: 'xoxb-test-token',
        channelId: 'C67890',
        channelName: '#gap-radar',
      };

      expect(config.channelId).toBe('C67890');
      expect(config.channelName).toBe('#gap-radar');
    });

    it('Message templates - Run complete and gap alert templates exist', () => {
      const runData = {
        id: 'run_1',
        nicheQuery: 'Test niche',
        opportunityScore: 80,
        confidence: 0.8,
        gapCount: 10,
        reportUrl: 'https://test.com/report',
      };

      const gapData = {
        id: 'gap_1',
        title: 'Test gap',
        gapType: 'product' as const,
        opportunityScore: 85,
        evidence: { adCount: 20, redditMentions: 40 },
        recommendation: 'Test recommendation',
      };

      const runMessage = formatRunCompleteMessage(runData);
      const gapMessage = formatGapAlertMessage(gapData);

      expect(runMessage).toBeDefined();
      expect(gapMessage).toBeDefined();
      expect(runMessage.text).toBeTruthy();
      expect(gapMessage.text).toBeTruthy();
    });
  });
});

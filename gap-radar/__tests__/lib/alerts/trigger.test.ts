/**
 * Tests for Alert Trigger System (BRIEF-007)
 *
 * Tests the alert triggering, email sending, and dashboard notification system
 */

// Mock dependencies BEFORE imports
jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

jest.mock('@/lib/email/resend', () => ({
  sendEmail: jest.fn(),
  initializeResend: jest.fn(),
}));

import { triggerAlert, triggerAlertsForNiche } from '@/lib/alerts/trigger';
import type { Alert } from '@/lib/alerts/detector';
import { sendEmail } from '@/lib/email/resend';

// Setup mock data
let mockNicheData: any = {
  id: 'niche-123',
  offering_name: 'Test Niche',
  user_id: 'user-123',
  users: {
    email: 'test@example.com',
    full_name: 'Test User',
  },
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: table === 'user_niches' ? mockNicheData : {
              id: 'user-123',
              email: 'test@example.com',
              full_name: 'Test User',
            },
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

describe('Alert Trigger System', () => {
  const mockAlert: Alert = {
    niche_id: 'niche-123',
    alert_type: 'trend_spike',
    title: 'Demand spike detected (+20 points)',
    body: 'Your niche is showing significant growth',
    urgency: 'high',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerAlert', () => {
    it('should send email notification for alert', async () => {
      const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
      mockSendEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
        sentAt: new Date(),
      });

      const result = await triggerAlert(mockAlert, 'test@example.com', 'Test Niche');

      expect(result.emailSent).toBe(true);
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Alert'),
          html: expect.stringContaining('Demand spike detected'),
        })
      );
    });

    it('should save notification to database', async () => {
      const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
      mockSendEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
        sentAt: new Date(),
      });

      const result = await triggerAlert(mockAlert, 'test@example.com', 'Test Niche');

      expect(result.notificationSaved).toBe(true);
    });

    it('should handle email sending failures gracefully', async () => {
      const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
      mockSendEmail.mockResolvedValue({
        success: false,
        error: 'Email service unavailable',
      });

      const result = await triggerAlert(mockAlert, 'test@example.com', 'Test Niche');

      expect(result.emailSent).toBe(false);
      expect(result.error).toContain('Email service unavailable');
    });

    it('should include urgency indicator in email for high urgency alerts', async () => {
      const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
      mockSendEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
        sentAt: new Date(),
      });

      await triggerAlert(mockAlert, 'test@example.com', 'Test Niche');

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('🔴'),
        })
      );
    });

    it('should format different alert types correctly', async () => {
      const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
      mockSendEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
        sentAt: new Date(),
      });

      const pricingAlert: Alert = {
        niche_id: 'niche-123',
        alert_type: 'competitor_price',
        title: 'Competitor X decreased pricing by 15%',
        body: 'Competitor X changed pricing from $99 to $84',
        urgency: 'medium',
      };

      await triggerAlert(pricingAlert, 'test@example.com', 'Test Niche');

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('Competitor X'),
        })
      );
    });
  });

  describe('triggerAlertsForNiche', () => {
    it('should trigger multiple alerts for a niche', async () => {
      const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
      mockSendEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
        sentAt: new Date(),
      });

      const alerts: Alert[] = [
        mockAlert,
        {
          niche_id: 'niche-123',
          alert_type: 'new_angle',
          title: 'New messaging angles spotted',
          body: 'Competitors are testing new approaches',
          urgency: 'medium',
        },
      ];

      const result = await triggerAlertsForNiche('niche-123', alerts);

      expect(result.triggered).toBe(2);
      expect(result.emailsSent).toBe(2);
      expect(mockSendEmail).toHaveBeenCalledTimes(2);
    });

    it('should batch multiple alerts into a single email if more than 3', async () => {
      const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
      mockSendEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
        sentAt: new Date(),
      });

      const alerts: Alert[] = [
        mockAlert,
        { ...mockAlert, alert_type: 'new_angle' as const },
        { ...mockAlert, alert_type: 'pain_surge' as const },
        { ...mockAlert, alert_type: 'competitor_price' as const },
      ];

      const result = await triggerAlertsForNiche('niche-123', alerts);

      // Should send 1 batched email instead of 4 separate ones
      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(result.triggered).toBe(4);
    });

    it('should return empty result if no alerts provided', async () => {
      const result = await triggerAlertsForNiche('niche-123', []);

      expect(result.triggered).toBe(0);
      expect(result.emailsSent).toBe(0);
    });
  });

  describe('Alert Email Formatting', () => {
    it('should include niche name in subject line', async () => {
      const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
      mockSendEmail.mockResolvedValue({
        success: true,
        id: 'email-123',
        sentAt: new Date(),
      });

      await triggerAlert(mockAlert, 'test@example.com', 'AI Writing Tools');

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('AI Writing Tools'),
        })
      );
    });

    it('should include urgency emoji in subject based on alert urgency', async () => {
      const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
      mockSendEmail.mockResolvedValue({ success: true, id: 'email-123', sentAt: new Date() });

      // High urgency
      await triggerAlert({ ...mockAlert, urgency: 'high' }, 'test@example.com', 'Test');
      expect(mockSendEmail).toHaveBeenLastCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('🔴'),
        })
      );

      // Medium urgency
      await triggerAlert({ ...mockAlert, urgency: 'medium' }, 'test@example.com', 'Test');
      expect(mockSendEmail).toHaveBeenLastCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('🟡'),
        })
      );

      // Low urgency
      await triggerAlert({ ...mockAlert, urgency: 'low' }, 'test@example.com', 'Test');
      expect(mockSendEmail).toHaveBeenLastCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('🟢'),
        })
      );
    });
  });
});

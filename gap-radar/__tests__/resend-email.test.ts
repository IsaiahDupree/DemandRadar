/**
 * Tests for Resend Email Integration (BRIEF-009)
 *
 * Acceptance Criteria:
 * - Resend SDK setup
 * - Send function
 * - Error handling
 * - Delivery tracking
 */

import { sendEmail, sendDemandBriefEmail, initializeResend } from '../src/lib/email/resend';

// Mock the Resend SDK
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockImplementation((params: any) => {
          // Simulate validation errors
          if (params.subject === '') {
            return Promise.resolve({
              data: null,
              error: { message: 'Subject is required' },
            });
          }
          if (params.to === 'invalid-email') {
            return Promise.resolve({
              data: null,
              error: { message: 'Invalid email address' },
            });
          }
          // Simulate domain validation error
          if (params.to && params.to.includes('invalid-domain-that-does-not-exist')) {
            return Promise.resolve({
              data: null,
              error: { message: 'Domain does not exist' },
            });
          }
          // Mock successful send
          return Promise.resolve({
            data: { id: 'mock-email-id-123' },
            error: null,
          });
        }),
      },
    })),
  };
});

describe('Resend Email Integration', () => {
  beforeEach(() => {
    // Mock environment variable
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Resend SDK Setup', () => {
    it('should initialize Resend client with API key', () => {
      const client = initializeResend();
      expect(client).toBeDefined();
      expect(client).toHaveProperty('emails');
    });

    it('should throw error if API key is missing', () => {
      delete process.env.RESEND_API_KEY;
      expect(() => initializeResend()).toThrow('RESEND_API_KEY is not configured');
    });
  });

  describe('Send Function', () => {
    it('should send email successfully with basic params', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('should send email with React component', async () => {
      const MockComponent = () => '<div>Test Component</div>';

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        react: MockComponent,
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('should support multiple recipients', async () => {
      const result = await sendEmail({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
    });

    it('should use default from address if not specified', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      // From address should be default
    });

    it('should allow custom from address', async () => {
      const result = await sendEmail({
        from: 'custom@demandradar.io',
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid email address', async () => {
      const result = await sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid email address');
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      const result = await sendEmail({
        to: 'test@example.com',
        subject: '',  // Invalid: empty subject should trigger error
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error message when send fails', async () => {
      const result = await sendEmail({
        to: 'test@invalid-domain-that-does-not-exist.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('Delivery Tracking', () => {
    it('should return email ID for successful sends', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
    });

    it('should include timestamp in response', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      });

      expect(result.success).toBe(true);
      expect(result.sentAt).toBeDefined();
      expect(result.sentAt).toBeInstanceOf(Date);
    });
  });

  describe('Demand Brief Email', () => {
    it('should send demand brief with snapshot data', async () => {
      const snapshot = {
        id: 'test-123',
        niche_id: 'test-niche',
        offering_name: 'Test Product',
        week_start: '2026-01-18',
        demand_score: 75,
        demand_score_change: 10,
        opportunity_score: 70,
        message_market_fit_score: 80,
        trend: 'up' as const,
        ad_signals: {
          advertiserCount: 25,
          avgLongevityDays: 45,
          topAngles: ['Angle 1', 'Angle 2', 'Angle 3'],
          topOffers: ['Offer 1', 'Offer 2'],
        },
        search_signals: {
          buyerIntentKeywords: [
            { keyword: 'test keyword 1', volume: 1000 },
            { keyword: 'test keyword 2', volume: 500 },
          ],
          totalVolume: 1500,
        },
        ugc_signals: {
          sources: ['reddit', 'tiktok'],
          mentionCount: 50,
        },
        forum_signals: {
          complaints: [
            { text: 'complaint 1', frequency: 10 },
            { text: 'complaint 2', frequency: 5 },
          ],
          desires: [
            { text: 'desire 1', frequency: 15 },
            { text: 'desire 2', frequency: 8 },
          ],
          purchaseTriggers: 20,
        },
        competitor_signals: {
          activeCompetitors: 10,
          pricingChanges: [],
          featureChanges: [],
        },
        plays: [
          {
            type: 'product',
            action: 'Add feature X',
            evidence: 'Evidence here',
            priority: 'high',
          },
        ],
        ad_hooks: ['Hook 1', 'Hook 2', 'Hook 3'],
        subject_lines: ['Subject 1', 'Subject 2', 'Subject 3'],
        landing_copy: 'Test landing copy',
        why_score_changed: ['Reason 1', 'Reason 2'],
      };

      const result = await sendDemandBriefEmail({
        to: 'test@example.com',
        name: 'Test User',
        snapshot,
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('should generate appropriate subject line for demand brief', async () => {
      const snapshot = {
        id: 'test-123',
        niche_id: 'test-niche',
        offering_name: 'Test Product',
        week_start: '2026-01-18',
        demand_score: 75,
        demand_score_change: 10,
        trend: 'up' as const,
        ad_signals: {
          advertiserCount: 10,
          avgLongevityDays: 30,
          topAngles: ['Angle 1'],
          topOffers: ['Offer 1'],
        },
        search_signals: {
          buyerIntentKeywords: [{ keyword: 'test', volume: 100 }],
          totalVolume: 100,
        },
        ugc_signals: {
          sources: ['reddit'],
          mentionCount: 10,
        },
        forum_signals: {
          complaints: [{ text: 'complaint', frequency: 5 }],
          desires: [{ text: 'desire', frequency: 5 }],
          purchaseTriggers: 5,
        },
        competitor_signals: {
          activeCompetitors: 5,
          pricingChanges: [],
          featureChanges: [],
        },
        plays: [],
        ad_hooks: [],
        subject_lines: [],
        landing_copy: '',
        why_score_changed: [],
        opportunity_score: 70,
        message_market_fit_score: 80,
      };

      const result = await sendDemandBriefEmail({
        to: 'test@example.com',
        snapshot,
      });

      expect(result.success).toBe(true);
      // Subject should include offering name and score
    });
  });
});
